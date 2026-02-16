import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "./env.ts";
import { auth } from "./lib/auth.ts";
import { personRoutes } from "./routes/persons.ts";
import { callRoutes } from "./routes/calls.ts";
import { assessmentRoutes } from "./routes/assessments.ts";
import { escalationRoutes } from "./routes/escalations.ts";
import { analyticsRoutes } from "./routes/analytics.ts";
import { twilioVoiceRoutes } from "./routes/twilio/voice.ts";
import { twilioStatusRoutes } from "./routes/twilio/status.ts";
import { twilioRecordingRoutes } from "./routes/twilio/recording.ts";
import { twilioIntelligenceRoutes } from "./routes/twilio/intelligence.ts";
import { seedRoutes } from "./routes/seed.ts";
import { handleWebSocket } from "./ws/handler.ts";
import { consumeWsToken } from "./lib/twilio.ts";
import type { AppVariables } from "./types.ts";

const isLocal = env.BASE_URL.includes("localhost") || env.BASE_URL.includes("127.0.0.1");

const app = new Hono<{ Variables: AppVariables }>();

// --- CORS (localhost origins only in dev) ---
const allowedOrigins = [env.BASE_URL];
if (isLocal) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}
app.use("/*", cors({ origin: allowedOrigins, credentials: true }));

// --- Rate limiting ---
// General API: 120 requests/min per IP (generous for normal UI use)
app.use(
  "/api/*",
  rateLimiter({
    windowMs: 60_000,
    limit: 120,
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "global",
    skip: (c) => c.req.path.startsWith("/api/twilio/"), // Twilio webhooks are signature-validated
  }),
);

// Call trigger: 5 calls/min per IP (each costs Twilio + Anthropic credits)
app.use(
  "/api/calls/trigger",
  rateLimiter({
    windowMs: 60_000,
    limit: 5,
    keyGenerator: (c) => `trigger:${c.req.header("x-forwarded-for") ?? "anonymous"}`,
    message: { error: "Rate limit exceeded — max 5 calls per minute" },
  }),
);

// Auth rate limiting: 10 attempts/min per IP
app.use(
  "/api/auth/sign-in/*",
  rateLimiter({
    windowMs: 60_000,
    limit: 10,
    keyGenerator: (c) => `auth:${c.req.header("x-forwarded-for") ?? "anonymous"}`,
  }),
);
app.use(
  "/api/auth/sign-up/*",
  rateLimiter({
    windowMs: 60_000,
    limit: 5,
    keyGenerator: (c) => `signup:${c.req.header("x-forwarded-for") ?? "anonymous"}`,
  }),
);

// Seed rate limiting: 1 request/5min per IP
app.use(
  "/api/seed",
  rateLimiter({
    windowMs: 300_000,
    limit: 1,
    keyGenerator: (c) => `seed:${c.req.header("x-forwarded-for") ?? "anonymous"}`,
    message: { error: "Seed can only be run once every 5 minutes" },
  }),
);

// --- Auth routes (handled by better-auth) ---
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// --- Session middleware (protect API routes) ---
app.use("/api/*", async (c, next) => {
  const path = c.req.path;
  if (
    path.startsWith("/api/auth/") ||
    path.startsWith("/api/twilio/") ||
    path.startsWith("/api/dev/") ||
    path === "/api/health"
  ) {
    return next();
  }
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("userId", session.user.id);
  c.set("userEmail", session.user.email);
  return next();
});

// --- API routes ---
app.route("/api/persons", personRoutes);
app.route("/api/calls", callRoutes);
app.route("/api/assessments", assessmentRoutes);
app.route("/api/escalations", escalationRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/twilio/voice", twilioVoiceRoutes);
app.route("/api/twilio/status", twilioStatusRoutes);
app.route("/api/twilio/recording", twilioRecordingRoutes);
app.route("/api/twilio/intelligence", twilioIntelligenceRoutes);
app.route("/api/seed", seedRoutes);

// Health check
app.get("/api/health", (c) => c.json({ ok: true, name: "claudecare" }));

// --- Dev-only: trigger call (localhost only, requires auth + userId scoping) ---
app.post("/api/dev/trigger-call", async (c) => {
  // Only accessible from localhost — check request URL, not user-controlled Host header
  const reqHostname = new URL(c.req.url).hostname;
  if (reqHostname !== "localhost" && reqHostname !== "127.0.0.1") {
    return c.json({ error: "Dev endpoint only available on localhost" }, 403);
  }
  // Require auth even in dev mode to enforce multi-tenancy
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const userId = session.user.id;
  const { personId, callType } = await c.req.json();
  const { CALL_TYPES } = await import("./lib/constants.ts");
  const { db, schema } = await import("./lib/db.ts");
  const { eq, and } = await import("drizzle-orm");
  const { initiateCall } = await import("./lib/twilio.ts");
  const [person] = await db.select().from(schema.persons).where(
    and(eq(schema.persons.id, personId), eq(schema.persons.userId, userId)),
  );
  if (!person) return c.json({ error: "Person not found" }, 404);
  const [call] = await db.insert(schema.calls).values({
    personId,
    callType: callType ?? CALL_TYPES.STANDARD,
    status: "scheduled",
    scheduledFor: new Date(),
  }).returning();
  // Call Twilio directly (skip pg-boss queue for dev)
  console.log(`[dev] Triggering ${callType ?? CALL_TYPES.STANDARD} call ${call!.id} for ${person.name} (${person.phone})`);
  await initiateCall(call!.id, person.id, person.phone);
  return c.json(call, 201);
});

// --- Serve React SPA (production) ---
app.use("/*", serveStatic({ root: "./dist/client" }));
app.get("/*", serveStatic({ path: "./dist/client/index.html" }));

// --- Start server with WebSocket ---
const server = Bun.serve({
  port: env.PORT,
  fetch(req, server) {
    // Upgrade WebSocket connections for Twilio ConversationRelay
    const url = new URL(req.url);
    if (url.pathname === "/ws/conversation-relay") {
      const wsToken = url.searchParams.get("wsToken");
      if (!wsToken) {
        return new Response("Missing wsToken", { status: 401 });
      }
      const tokenData = consumeWsToken(wsToken);
      if (!tokenData) {
        return new Response("Invalid or expired wsToken", { status: 401 });
      }
      const upgraded = server.upgrade(req, { data: tokenData });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: handleWebSocket,
});

console.log(`[claudecare] Server running on http://localhost:${server.port}`);

// --- Sync Intelligence Service webhook URL with current BASE_URL ---
if (env.TWILIO_INTELLIGENCE_SERVICE_SID) {
  import("twilio").then(({ default: Twilio }) => {
    const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    const webhookUrl = `${env.BASE_URL}/api/twilio/intelligence`;
    client.intelligence.v2
      .services(env.TWILIO_INTELLIGENCE_SERVICE_SID!)
      .update({ webhookUrl, webhookHttpMethod: "POST" })
      .then(() => console.log(`[intelligence] Webhook URL set to ${webhookUrl}`))
      .catch((err: Error) => {
        console.error(`[intelligence] FATAL: Failed to update webhook URL: ${err.message}`);
        process.exit(1);
      });
  });
}

// --- Start pg-boss workers (same process) ---
// Initialized in jobs/boss.ts — imported after server starts
import("./jobs/boss.ts")
  .then((m) => m.startWorkers())
  .then(() => console.log("[claudecare] Background workers started"))
  .catch((err) => {
    console.error("[claudecare] FATAL: Workers failed to start:", err.message);
    process.exit(1);
  });

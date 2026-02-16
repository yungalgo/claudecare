import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
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
import { handleWebSocket } from "./ws/handler.ts";
import { consumeWsToken } from "./lib/twilio.ts";
import type { AppVariables } from "./types.ts";

const app = new Hono<{ Variables: AppVariables }>();

app.use(
  "/*",
  cors({
    origin: [
      env.BASE_URL,
      // Always allow localhost in dev (BASE_URL may be ngrok)
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
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

// Health check
app.get("/api/health", (c) => c.json({ ok: true, name: "claudecare" }));

// --- Dev-only: trigger call (localhost only, requires auth + userId scoping) ---
app.post("/api/dev/trigger-call", async (c) => {
  const host = c.req.header("host") ?? "";
  if (!host.includes("localhost")) {
    return c.json({ error: "Dev endpoint only available on localhost" }, 403);
  }
  // Require auth even in dev mode to enforce multi-tenancy
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const userId = session.user.id;
  const { personId, callType } = await c.req.json();
  const { db, schema } = await import("./lib/db.ts");
  const { eq, and } = await import("drizzle-orm");
  const { initiateCall } = await import("./lib/twilio.ts");
  const [person] = await db.select().from(schema.persons).where(
    and(eq(schema.persons.id, personId), eq(schema.persons.userId, userId)),
  );
  if (!person) return c.json({ error: "Person not found" }, 404);
  const [call] = await db.insert(schema.calls).values({
    personId,
    callType: callType ?? "weekly",
    status: "scheduled",
    scheduledFor: new Date(),
  }).returning();
  // Call Twilio directly (skip pg-boss queue for dev)
  console.log(`[dev] Triggering ${callType ?? "weekly"} call ${call!.id} for ${person.name} (${person.phone})`);
  console.log(`[dev] BASE_URL=${env.BASE_URL}`);
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

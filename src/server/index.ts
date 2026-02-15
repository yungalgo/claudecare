import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { env } from "./env.ts";
import { auth } from "./lib/auth.ts";
import { personRoutes } from "./routes/persons.ts";
import { callRoutes } from "./routes/calls.ts";
import { assessmentRoutes } from "./routes/assessments.ts";
import { escalationRoutes } from "./routes/escalations.ts";
import { twilioVoiceRoutes } from "./routes/twilio/voice.ts";
import { twilioStatusRoutes } from "./routes/twilio/status.ts";
import { twilioRecordingRoutes } from "./routes/twilio/recording.ts";
import { handleWebSocket } from "./ws/handler.ts";

const app = new Hono();

app.use("/*", cors());

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
    path === "/api/health"
  ) {
    return next();
  }
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// --- API routes ---
app.route("/api/persons", personRoutes);
app.route("/api/calls", callRoutes);
app.route("/api/assessments", assessmentRoutes);
app.route("/api/escalations", escalationRoutes);
app.route("/api/twilio/voice", twilioVoiceRoutes);
app.route("/api/twilio/status", twilioStatusRoutes);
app.route("/api/twilio/recording", twilioRecordingRoutes);

// Health check
app.get("/api/health", (c) => c.json({ ok: true, name: "claudecare" }));

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
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: handleWebSocket,
});

console.log(`[claudecare] Server running on http://localhost:${server.port}`);

// --- Start pg-boss workers (same process) ---
// Initialized in jobs/boss.ts — imported after server starts
import("./jobs/boss.ts")
  .then((m) => m.startWorkers())
  .then(() => console.log("[claudecare] Background workers started"))
  .catch((err) => console.warn("[claudecare] Workers not started:", err.message));

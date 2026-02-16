import { Hono } from "hono";
import { env } from "../../env.ts";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";

export const twilioVoiceRoutes = new Hono();

twilioVoiceRoutes.use("/*", twilioSignatureMiddleware);

// TwiML endpoint — Twilio calls this when a call connects
// Returns TwiML that sets up ConversationRelay WebSocket
twilioVoiceRoutes.post("/answer", async (c) => {
  const wsToken = c.req.query("wsToken") ?? "";

  // Build WS URL — replace("http", "ws") correctly converts https→wss
  const wsUrl = `${env.BASE_URL.replace("http", "ws")}/ws/conversation-relay?wsToken=${wsToken}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${wsUrl}" voice="Google.en-US-Journey-F" dtmfDetection="true" interruptible="true" />
  </Connect>
</Response>`;

  return c.text(twiml, 200, { "Content-Type": "application/xml" });
});

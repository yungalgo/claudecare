import { Hono } from "hono";
import { env } from "../../env.ts";

export const twilioVoiceRoutes = new Hono();

// TwiML endpoint — Twilio calls this when a call connects
// Returns TwiML that sets up ConversationRelay WebSocket
twilioVoiceRoutes.post("/answer", async (c) => {
  const callSid = c.req.query("callSid") ?? "";
  const personId = c.req.query("personId") ?? "";

  const wsUrl = `${env.BASE_URL.replace("http", "ws")}/ws/conversation-relay?callSid=${callSid}&personId=${personId}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${wsUrl}" voice="Google.en-US-Journey-F" dtmfDetection="true" interruptible="true" />
  </Connect>
</Response>`;

  return c.text(twiml, 200, { "Content-Type": "application/xml" });
});

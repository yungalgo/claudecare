import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq } from "drizzle-orm";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";

type TwilioVars = { Variables: { twilioBody: Record<string, string> } };
export const twilioRecordingRoutes = new Hono<TwilioVars>();

twilioRecordingRoutes.use("/*", twilioSignatureMiddleware);

// Recording status webhook — Twilio posts when recording is ready
twilioRecordingRoutes.post("/", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const callSid = body.CallSid;
  const recordingUrl = body.RecordingUrl;

  console.log(`[twilio:recording] ${callSid} → ${recordingUrl}`);

  if (callSid && recordingUrl) {
    await db
      .update(schema.calls)
      .set({ recordingUrl })
      .where(eq(schema.calls.callSid, callSid));
  }

  return c.json({ ok: true });
});

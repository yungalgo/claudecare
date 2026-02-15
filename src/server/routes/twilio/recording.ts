import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq } from "drizzle-orm";

export const twilioRecordingRoutes = new Hono();

// Recording status webhook — Twilio posts when recording is ready
twilioRecordingRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();
  const callSid = body.CallSid as string;
  const recordingUrl = body.RecordingUrl as string;

  console.log(`[twilio:recording] ${callSid} → ${recordingUrl}`);

  if (callSid && recordingUrl) {
    await db
      .update(schema.calls)
      .set({ recordingUrl })
      .where(eq(schema.calls.callSid, callSid));
  }

  return c.json({ ok: true });
});

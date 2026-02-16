import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq } from "drizzle-orm";
import { processPostCall } from "../../jobs/post-call.ts";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";

type TwilioVars = { Variables: { twilioBody: Record<string, string> } };
export const twilioStatusRoutes = new Hono<TwilioVars>();

twilioStatusRoutes.use("/*", twilioSignatureMiddleware);

// Call status webhook — Twilio posts status updates here
twilioStatusRoutes.post("/", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const callSid = body.CallSid;
  const callStatus = body.CallStatus;
  const duration = body.CallDuration ? Number(body.CallDuration) : undefined;

  console.log(`[twilio:status] ${callSid} → ${callStatus}`);

  if (!callSid || !callStatus) return c.json({ ok: true });

  const statusMap: Record<string, string> = {
    queued: "scheduled",
    ringing: "scheduled",
    "in-progress": "in-progress",
    completed: "completed",
    busy: "no-answer",
    "no-answer": "no-answer",
    failed: "failed",
    canceled: "failed",
  };

  const updateData: Record<string, unknown> = {
    status: statusMap[callStatus] ?? callStatus,
  };

  if (callStatus === "in-progress") {
    updateData.startedAt = new Date();
  }
  if (callStatus === "completed") {
    updateData.completedAt = new Date();
    if (duration) updateData.duration = duration;
  }
  if (callStatus === "failed" || callStatus === "canceled") {
    updateData.errorMessage = `Call ${callStatus}`;
  }

  await db
    .update(schema.calls)
    .set(updateData)
    .where(eq(schema.calls.callSid, callSid));

  // Run post-call processing directly when call completes
  if (callStatus === "completed") {
    const [call] = await db
      .select({ id: schema.calls.id })
      .from(schema.calls)
      .where(eq(schema.calls.callSid, callSid));

    if (call) {
      // Run post-call inline (don't rely on pg-boss for this critical path)
      processPostCall(call.id).catch((err) =>
        console.error(`[twilio:status] Post-call processing failed:`, err),
      );
    }
  }

  return c.json({ ok: true });
});

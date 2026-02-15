import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq } from "drizzle-orm";

export const twilioStatusRoutes = new Hono();

// Call status webhook — Twilio posts status updates here
twilioStatusRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();
  const callSid = body.CallSid as string;
  const callStatus = body.CallStatus as string;
  const duration = body.CallDuration ? Number(body.CallDuration) : undefined;

  console.log(`[twilio:status] ${callSid} → ${callStatus}`);

  if (!callSid) return c.json({ ok: true });

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

  return c.json({ ok: true });
});

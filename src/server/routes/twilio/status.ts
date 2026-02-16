import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq, and, gte, sql } from "drizzle-orm";
import { processPostCall } from "../../jobs/post-call.ts";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";
import { getBoss } from "../../jobs/boss.ts";
import { createEscalation } from "../../lib/escalation.ts";
import { env } from "../../env.ts";

type TwilioVars = { Variables: { twilioBody: Record<string, string> } };
export const twilioStatusRoutes = new Hono<TwilioVars>();

twilioStatusRoutes.use("/*", twilioSignatureMiddleware);

const MAX_RETRIES = 2;

/** Check if we're within the call window */
function isWithinCallWindow(): boolean {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    timeZone: env.CALL_WINDOW_TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  return timeStr < env.CALL_WINDOW_END;
}

// Call status webhook — Twilio posts status updates here
twilioStatusRoutes.post("/", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const callSid = body.CallSid;
  const callStatus = body.CallStatus;
  const duration = body.CallDuration ? Number(body.CallDuration) : undefined;
  const answeredBy = body.AnsweredBy;

  console.log(`[twilio:status] ${callSid} → ${callStatus}${answeredBy ? ` (answeredBy: ${answeredBy})` : ""}`);

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

  // Detect voicemail via AMD
  const isVoicemail = answeredBy?.startsWith("machine");
  const mappedStatus = isVoicemail ? "voicemail" : (statusMap[callStatus] ?? callStatus);

  const updateData: Record<string, unknown> = {
    status: mappedStatus,
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

  // Run post-call processing when call completes normally
  if (callStatus === "completed" && !isVoicemail) {
    const [call] = await db
      .select({ id: schema.calls.id })
      .from(schema.calls)
      .where(eq(schema.calls.callSid, callSid));

    if (call) {
      processPostCall(call.id).catch((err) =>
        console.error(`[twilio:status] Post-call processing failed:`, err),
      );
    }
  }

  // Retry logic for no-answer, voicemail, or failed outbound calls
  const shouldRetry = mappedStatus === "no-answer" || mappedStatus === "voicemail" || (mappedStatus === "failed" && callStatus !== "canceled");
  if (shouldRetry) {
    const [call] = await db
      .select({ id: schema.calls.id, personId: schema.calls.personId, retryCount: schema.calls.retryCount, callSource: schema.calls.callSource })
      .from(schema.calls)
      .where(eq(schema.calls.callSid, callSid));

    if (call && call.callSource === "outbound") {
      const retries = call.retryCount ?? 0;
      if (retries < MAX_RETRIES && isWithinCallWindow()) {
        // Schedule retry in 15 minutes
        console.log(`[twilio:status] Scheduling retry ${retries + 1}/${MAX_RETRIES} for call ${call.id}`);
        await db.update(schema.calls).set({ retryCount: retries + 1 }).where(eq(schema.calls.id, call.id));
        const boss = await getBoss();
        await boss.send("process-call", { callId: call.id }, { startAfter: 15 * 60 });
      } else {
        // Max retries reached or past call window — check for consecutive misses
        console.log(`[twilio:status] No more retries for call ${call.id} (retries=${retries}, inWindow=${isWithinCallWindow()})`);
        await checkConsecutiveMisses(call.personId);
        // Chain next call
        const boss = await getBoss();
        await boss.send("process-next-call", {});
      }
    }
  }

  return c.json({ ok: true });
});

/** Check if person has 3+ consecutive missed calls in 21 days → create escalation */
async function checkConsecutiveMisses(personId: string) {
  const twentyOneDaysAgo = new Date();
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

  const recentCalls = await db
    .select({ status: schema.calls.status })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.personId, personId),
        gte(schema.calls.createdAt, twentyOneDaysAgo),
      ),
    )
    .orderBy(sql`${schema.calls.createdAt} DESC`)
    .limit(5);

  // Count consecutive non-completed calls from the most recent
  let consecutiveMisses = 0;
  for (const call of recentCalls) {
    if (call.status === "completed" || call.status === "in-progress") break;
    consecutiveMisses++;
  }

  if (consecutiveMisses >= 3) {
    await createEscalation({
      personId,
      tier: "routine",
      reason: "Unable to reach — consecutive missed calls",
      details: `${consecutiveMisses} consecutive missed calls in the last 21 days. Care coordinator should attempt alternate contact.`,
    });
  }
}

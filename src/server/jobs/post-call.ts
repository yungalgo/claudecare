import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import { scoreAssessment } from "../lib/scoring.ts";
import { createEscalation } from "../lib/escalation.ts";

export async function processPostCall(callId: string) {
  const [call] = await db.select().from(schema.calls).where(eq(schema.calls.id, callId));
  if (!call) return;

  // Get the assessment created during the call
  const [assessment] = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.callId, callId));

  if (!assessment) {
    console.log(`[post-call] No assessment for call ${callId}`);
    return;
  }

  // Re-score and flag
  const result = scoreAssessment(assessment);

  // Update assessment flag
  await db
    .update(schema.assessments)
    .set({ flag: result.flag })
    .where(eq(schema.assessments.id, assessment.id));

  // Update person flag
  await db
    .update(schema.persons)
    .set({ flag: result.flag })
    .where(eq(schema.persons.id, call.personId));

  // Create escalations as needed
  for (const esc of result.escalations) {
    await createEscalation({
      personId: call.personId,
      callId,
      tier: esc.tier,
      reason: esc.reason,
      details: esc.details,
    });
  }

  console.log(`[post-call] Call ${callId}: flag=${result.flag}, escalations=${result.escalations.length}`);
}

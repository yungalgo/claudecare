import { db, schema } from "./db.ts";

interface CreateEscalationInput {
  personId: string;
  callId?: string;
  tier: string;
  reason: string;
  details?: string;
}

export async function createEscalation(input: CreateEscalationInput) {
  const [escalation] = await db
    .insert(schema.escalations)
    .values({
      personId: input.personId,
      callId: input.callId,
      tier: input.tier,
      reason: input.reason,
      details: input.details,
      status: "pending",
    })
    .returning();

  console.log(`[escalation] Created ${input.tier} escalation for person ${input.personId}: ${input.reason}`);

  // For immediate tier, log urgently
  if (input.tier === "immediate") {
    console.error(`[IMMEDIATE ESCALATION] Person ${input.personId}: ${input.reason}`);
    // TODO: Send SMS/email notification to emergency contacts
  }

  return escalation;
}

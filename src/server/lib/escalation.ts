import { db, schema } from "./db.ts";
import { eq } from "drizzle-orm";
import { env } from "../env.ts";
import { sendEscalationAlert } from "./email.ts";

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

  // Get the person's name and owning user
  const [person] = await db
    .select({ name: schema.persons.name, userId: schema.persons.userId })
    .from(schema.persons)
    .where(eq(schema.persons.id, input.personId));

  const personName = person?.name ?? "Unknown Person";

  // Send email alerts for immediate and urgent escalations
  if (input.tier === "immediate" || input.tier === "urgent") {
    if (person?.userId) {
      // Email only the owning user, not all users
      const [owner] = await db
        .select({ email: schema.user.email })
        .from(schema.user)
        .where(eq(schema.user.id, person.userId));

      if (owner) {
        await sendEscalationAlert([owner.email], {
          personName,
          tier: input.tier,
          reason: input.reason,
          details: input.details,
          dashboardUrl: `${env.BASE_URL}/persons/${input.personId}`,
        });
      }
    }
  }

  if (input.tier === "immediate") {
    console.error(`[IMMEDIATE ESCALATION] ${personName}: ${input.reason}`);
  }

  return escalation;
}

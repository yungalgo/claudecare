import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import { initiateCall } from "../lib/twilio.ts";

export async function processCall(callId: string) {
  // Get call and person info
  const [call] = await db.select().from(schema.calls).where(eq(schema.calls.id, callId));
  if (!call) {
    throw new Error(`[call-processor] Call ${callId} not found`);
  }

  const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, call.personId));
  if (!person) {
    throw new Error(`[call-processor] Person ${call.personId} not found`);
  }

  if (person.status !== "active") {
    console.log(`[call-processor] Person ${person.name} is ${person.status}, skipping`);
    await db.update(schema.calls).set({ status: "failed", errorMessage: "Person not active" }).where(eq(schema.calls.id, callId));
    return;
  }

  // Initiate the Twilio call
  await initiateCall(callId, person.id, person.phone);
}

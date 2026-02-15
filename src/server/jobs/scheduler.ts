import type PgBoss from "pg-boss";
import { db, schema } from "../lib/db.ts";
import { eq, and, lt, isNull, or } from "drizzle-orm";

export async function scheduleCallBatches(boss: PgBoss) {
  // Find all active persons who haven't been called in 7+ days (or never called)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const persons = await db
    .select()
    .from(schema.persons)
    .where(
      and(
        eq(schema.persons.status, "active"),
        or(
          isNull(schema.persons.lastCallAt),
          lt(schema.persons.lastCallAt, sevenDaysAgo),
        ),
      ),
    );

  console.log(`[scheduler] Found ${persons.length} persons due for calls`);

  for (const person of persons) {
    // Create a call record
    const [call] = await db
      .insert(schema.calls)
      .values({
        personId: person.id,
        callType: "weekly",
        status: "scheduled",
        scheduledFor: new Date(),
      })
      .returning();

    // Queue the call
    await boss.send("process-call", { callId: call!.id });
  }

  console.log(`[scheduler] Scheduled ${persons.length} calls`);
}

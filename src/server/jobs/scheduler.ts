import type PgBoss from "pg-boss";
import { db, schema } from "../lib/db.ts";
import { eq, and, lt, isNull, or, asc } from "drizzle-orm";
import { env } from "../env.ts";

/**
 * Sequential call scheduler.
 * Finds the next person due for a call, creates a call record, and queues it.
 * Called once at CALL_WINDOW_START, then chained via post-call → process-next-call.
 */
export async function scheduleNextCall(boss: PgBoss): Promise<boolean> {
  // Check if we're still within the call window
  const now = new Date();
  const tz = env.CALL_WINDOW_TZ;
  const timeStr = now.toLocaleTimeString("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" });

  if (timeStr >= env.CALL_WINDOW_END) {
    console.log(`[scheduler] Past call window end (${env.CALL_WINDOW_END} ${tz}), stopping`);
    return false;
  }

  // Find next active person due for a call (lastCallAt null or > 7 days ago)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [person] = await db
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
    )
    .orderBy(asc(schema.persons.lastCallAt))
    .limit(1);

  if (!person) {
    console.log("[scheduler] No persons due for calls");
    return false;
  }

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
  console.log(`[scheduler] Scheduled call ${call!.id} for ${person.name}`);

  return true;
}

import type { PgBoss } from "pg-boss";
import { db, schema } from "../lib/db.ts";
import { eq, and, lt, isNull, or, asc, sql } from "drizzle-orm";
import { env } from "../env.ts";
import { CALL_TYPES, SCHEDULE_INTERVALS, CALL_SCHEDULES, determineCallType } from "../lib/constants.ts";

/**
 * Sequential call scheduler.
 * Finds the next person due for a call based on their callSchedule,
 * creates a call record, and queues it.
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

  // Find next active person due for a call based on their frequency setting
  // A person is due if lastCallAt is NULL or older than their frequency interval
  const [person] = await db
    .select()
    .from(schema.persons)
    .where(
      and(
        eq(schema.persons.status, "active"),
        or(
          isNull(schema.persons.lastCallAt),
          // Dynamic interval based on callSchedule (see constants.ts for values)
          sql`${schema.persons.lastCallAt} < NOW() - INTERVAL '1 day' * COALESCE(
            CASE ${schema.persons.callSchedule}
              WHEN ${CALL_SCHEDULES.TWICE_WEEKLY} THEN ${SCHEDULE_INTERVALS[CALL_SCHEDULES.TWICE_WEEKLY]}
              WHEN ${CALL_SCHEDULES.WEEKLY} THEN ${SCHEDULE_INTERVALS[CALL_SCHEDULES.WEEKLY]}
              WHEN ${CALL_SCHEDULES.BIWEEKLY} THEN ${SCHEDULE_INTERVALS[CALL_SCHEDULES.BIWEEKLY]}
              ELSE ${SCHEDULE_INTERVALS[CALL_SCHEDULES.WEEKLY]}
            END, ${SCHEDULE_INTERVALS[CALL_SCHEDULES.WEEKLY]})`,
        ),
      ),
    )
    .orderBy(asc(schema.persons.lastCallAt))
    .limit(1);

  if (!person) {
    console.log("[scheduler] No persons due for calls");
    return false;
  }

  // Determine call type: comprehensive every Nth call, otherwise standard
  const callCount = person.callCount ?? 0;
  const callType = determineCallType(callCount);

  // Create a call record
  const [call] = await db
    .insert(schema.calls)
    .values({
      personId: person.id,
      callType,
      callSource: "outbound",
      status: "scheduled",
      scheduledFor: new Date(),
    })
    .returning();

  // Queue the call
  await boss.send("process-call", { callId: call!.id });
  console.log(`[scheduler] Scheduled ${callType} call ${call!.id} for ${person.name} (schedule: ${person.callSchedule ?? "weekly"}, callCount: ${callCount})`);

  return true;
}

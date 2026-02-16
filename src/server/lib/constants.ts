/**
 * Single source of truth for call types, call schedules, and their relationships.
 *
 * CALL TYPE = what protocol/content runs during a call (standard, comprehensive, check-in)
 * CALL SCHEDULE = how often a person receives automated calls (twice-weekly, weekly, biweekly)
 *
 * These are intentionally separate concepts:
 * - A person on ANY schedule receives "standard" calls most of the time
 * - Every Nth call (COMPREHENSIVE_EVERY_N) is automatically a "comprehensive" call
 * - "check-in" is only for inbound calls when the person isn't due for screening
 */

// --- Call Types (protocol/content) ---

export const CALL_TYPES = {
  STANDARD: "standard",
  COMPREHENSIVE: "comprehensive",
  CHECK_IN: "check-in",
} as const;

export type CallType = (typeof CALL_TYPES)[keyof typeof CALL_TYPES];

// --- Call Schedules (frequency) ---

export const CALL_SCHEDULES = {
  TWICE_WEEKLY: "twice-weekly",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
} as const;

export type CallSchedule = (typeof CALL_SCHEDULES)[keyof typeof CALL_SCHEDULES];

// --- Schedule → Interval mapping (days between calls) ---

export const SCHEDULE_INTERVALS: Record<CallSchedule, number> = {
  [CALL_SCHEDULES.TWICE_WEEKLY]: 3,
  [CALL_SCHEDULES.WEEKLY]: 7,
  [CALL_SCHEDULES.BIWEEKLY]: 14,
};

const DEFAULT_INTERVAL = SCHEDULE_INTERVALS[CALL_SCHEDULES.WEEKLY];

/** Get the interval in days for a given call schedule. Falls back to weekly (7 days). */
export function getScheduleInterval(schedule: string | null | undefined): number {
  if (!schedule) return DEFAULT_INTERVAL;
  return SCHEDULE_INTERVALS[schedule as CallSchedule] ?? DEFAULT_INTERVAL;
}

// --- Comprehensive call cadence ---

/** Every Nth completed call is automatically a comprehensive call (count-based). */
export const COMPREHENSIVE_EVERY_N = 13;

/** Determine call type based on completed call count. */
export function determineCallType(callCount: number): CallType {
  return callCount > 0 && callCount % COMPREHENSIVE_EVERY_N === 0
    ? CALL_TYPES.COMPREHENSIVE
    : CALL_TYPES.STANDARD;
}


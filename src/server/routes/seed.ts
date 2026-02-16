import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import type { AppVariables } from "../types.ts";

export const seedRoutes = new Hono<{ Variables: AppVariables }>();

// --- Agent name pool ---
const AGENT_NAMES = [
  "Sarah", "Eleanor", "Dorothy", "Helen", "Ruth",
  "Betty", "Patricia", "Linda", "Barbara", "Margaret",
  "Virginia", "Catherine", "Frances", "Alice", "Jean",
];

// --- Helper utilities ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randInt(9, 16), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function fakeCallSid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let sid = "CA";
  for (let i = 0; i < 32; i++) sid += chars[Math.floor(Math.random() * chars.length)];
  return sid;
}

// --- Person profiles ---

interface PersonProfile {
  name: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  pcpName: string;
  pcpPhone: string;
  notes: string;
  callSchedule: string;
  targetFlag: "green" | "yellow" | "red";
}

const PERSON_PROFILES: PersonProfile[] = [
  // 10 GREEN
  {
    name: "Evelyn Thompson",
    phone: "+12025551001",
    emergencyContactName: "Mark Thompson (son)",
    emergencyContactPhone: "+12025551101",
    pcpName: "Dr. Rebecca Chen",
    pcpPhone: "+12025552001",
    notes: "Lives alone in apartment. Active in church group. Has a cat named Whiskers. Type 2 diabetes managed with metformin.",
    callSchedule: "biweekly",
    targetFlag: "green",
  },
  {
    name: "Robert Martinez",
    phone: "+12025551002",
    emergencyContactName: "Lisa Martinez (daughter)",
    emergencyContactPhone: "+12025551102",
    pcpName: "Dr. James Patel",
    pcpPhone: "+12025552002",
    notes: "Retired postal worker. Walks 2 miles daily. Wife passed 2 years ago but coping well. Mild hearing loss, uses hearing aid.",
    callSchedule: "weekly",
    targetFlag: "green",
  },
  {
    name: "Dorothy Washington",
    phone: "+12025551003",
    emergencyContactName: "Carol Williams (niece)",
    emergencyContactPhone: "+12025551103",
    pcpName: "Dr. Susan Kim",
    pcpPhone: "+12025552003",
    notes: "Former schoolteacher. Very sharp mentally. Volunteer tutor at library. Hypertension controlled with lisinopril.",
    callSchedule: "biweekly",
    targetFlag: "green",
  },
  {
    name: "Harold Jenkins",
    phone: "+12025551004",
    emergencyContactName: "Steve Jenkins (son)",
    emergencyContactPhone: "+12025551104",
    pcpName: "Dr. Michael Ross",
    pcpPhone: "+12025552004",
    notes: "Korean War veteran. Lives in senior community. Enjoys woodworking. Osteoarthritis in knees but manages well with PT.",
    callSchedule: "weekly",
    targetFlag: "green",
  },
  {
    name: "Margaret O'Brien",
    phone: "+12025551005",
    emergencyContactName: "Kathleen Doyle (daughter)",
    emergencyContactPhone: "+12025551105",
    pcpName: "Dr. Angela Fernandez",
    pcpPhone: "+12025552005",
    notes: "Active gardener. Hosts Sunday dinner for family weekly. Recently started water aerobics. Well-managed COPD.",
    callSchedule: "biweekly",
    targetFlag: "green",
  },
  {
    name: "James Liu",
    phone: "+12025551006",
    emergencyContactName: "Amy Liu (daughter-in-law)",
    emergencyContactPhone: "+12025551106",
    pcpName: "Dr. William Chang",
    pcpPhone: "+12025552006",
    notes: "Retired engineer. Plays chess at community center 3x/week. Speaks Mandarin primarily, comfortable in English. Mild cataracts.",
    callSchedule: "weekly",
    targetFlag: "green",
  },
  {
    name: "Patricia Anderson",
    phone: "+12025551007",
    emergencyContactName: "David Anderson (husband)",
    emergencyContactPhone: "+12025551107",
    pcpName: "Dr. Laura Bennett",
    pcpPhone: "+12025552007",
    notes: "Lives with husband who has early-stage Alzheimer's. She is the primary caregiver. Generally upbeat but monitoring caregiver stress.",
    callSchedule: "weekly",
    targetFlag: "green",
  },
  {
    name: "William Brown",
    phone: "+12025551008",
    emergencyContactName: "Sarah Brown (wife)",
    emergencyContactPhone: "+12025551108",
    pcpName: "Dr. Richard Torres",
    pcpPhone: "+12025552008",
    notes: "Retired firefighter. Strong social network. Active in VFW. Hip replacement 6 months ago, recovery on track.",
    callSchedule: "biweekly",
    targetFlag: "green",
  },
  {
    name: "Helen Kowalski",
    phone: "+12025551009",
    emergencyContactName: "Anna Kowalski (granddaughter)",
    emergencyContactPhone: "+12025551109",
    pcpName: "Dr. Maria Gonzalez",
    pcpPhone: "+12025552009",
    notes: "Polish immigrant, speaks excellent English. Enjoys cooking for neighbors. Attends senior center daily. A1C well controlled.",
    callSchedule: "weekly",
    targetFlag: "green",
  },
  {
    name: "George Davis",
    phone: "+12025551010",
    emergencyContactName: "Thomas Davis (son)",
    emergencyContactPhone: "+12025551110",
    pcpName: "Dr. Karen Mitchell",
    pcpPhone: "+12025552010",
    notes: "Former jazz musician. Still plays piano daily. Lives in own home, drives short distances. Mild benign essential tremor.",
    callSchedule: "biweekly",
    targetFlag: "green",
  },
  // 3 YELLOW
  {
    name: "Frank Nowak",
    phone: "+12025551011",
    emergencyContactName: "Jennifer Nowak (daughter)",
    emergencyContactPhone: "+12025551111",
    pcpName: "Dr. Robert Yang",
    pcpPhone: "+12025552011",
    notes: "Wife passed 4 months ago. Decreased appetite reported. Stopped attending bowling league. History of mild depression. Monitoring closely for grief-related decline.",
    callSchedule: "weekly",
    targetFlag: "yellow",
  },
  {
    name: "Gladys Monroe",
    phone: "+12025551012",
    emergencyContactName: "Rev. James Monroe (brother)",
    emergencyContactPhone: "+12025551112",
    pcpName: "Dr. Patricia Huang",
    pcpPhone: "+12025552012",
    notes: "Two falls in past month. Reduced mobility after second fall. Some social withdrawal. Daughter moved out of state. Reports feeling lonely. On blood thinner for AFib.",
    callSchedule: "twice-weekly",
    targetFlag: "yellow",
  },
  {
    name: "Arthur Simmons",
    phone: "+12025551013",
    emergencyContactName: "Deborah Simmons (wife)",
    emergencyContactPhone: "+12025551113",
    pcpName: "Dr. Steven Park",
    pcpPhone: "+12025552013",
    notes: "Chronic pain from spinal stenosis. Reports poor sleep most nights. Moderate anxiety. Wife provides daily support but works full-time. Missed last 2 PCP appointments.",
    callSchedule: "weekly",
    targetFlag: "yellow",
  },
  // 2 RED
  {
    name: "Virginia Palmer",
    phone: "+12025551014",
    emergencyContactName: "Michael Palmer (son)",
    emergencyContactPhone: "+12025551114",
    pcpName: "Dr. Linda Nakamura",
    pcpPhone: "+12025552014",
    notes: "Husband passed 6 weeks ago after long illness. Has expressed feeling that life has no purpose. Stopped eating regular meals. Psych referral pending. Son lives 3 hours away. HIGH PRIORITY - active monitoring.",
    callSchedule: "twice-weekly",
    targetFlag: "red",
  },
  {
    name: "Earl Washington",
    phone: "+12025551015",
    emergencyContactName: "Brenda Carter (sister)",
    emergencyContactPhone: "+12025551115",
    pcpName: "Dr. Christopher Lee",
    pcpPhone: "+12025552015",
    notes: "Terminal COPD diagnosis. Reports hopelessness and passive death wish. Estranged from children. History of depression and alcohol use. VA services engaged. Palliative care team involved. HIGH PRIORITY - daily wellness checks requested.",
    callSchedule: "twice-weekly",
    targetFlag: "red",
  },
];

// --- Call summary templates ---

function greenSummary(name: string): string {
  const templates = [
    `${name} reported feeling well today. Appetite is good, sleeping through the night. Enjoyed a visit from family over the weekend. No concerns raised.`,
    `${name} sounded cheerful and engaged. Has been staying active with daily walks. Mentioned looking forward to a community event this week. All indicators stable.`,
    `${name} described a routine week with no significant changes. Eating well, sleeping adequately. Spoke with a friend yesterday. No pain or mobility issues reported.`,
    `${name} was in good spirits. Reported good meal intake and restful sleep. Has been reading and watching favorite shows. Social contact this week through phone calls with family.`,
    `${name} reported a positive week overall. Blood pressure has been stable per home monitoring. Enjoyed cooking a meal for a neighbor. No new health concerns.`,
    `${name} was talkative and upbeat. Described attending a senior center event. Mobility remains good. Taking all medications as prescribed. No issues to report.`,
  ];
  return pick(templates);
}

function yellowSummary(name: string): string {
  const templates = [
    `${name} reported some difficulty sleeping this week. Appetite has been variable. Mentioned feeling lonely since friend moved away. Agreed to try attending a new activity at the community center.`,
    `${name} sounded somewhat low today. Reports eating only one full meal per day. Has not left the house in 3 days. Discussed importance of social engagement. Will follow up with PCP about sleep.`,
    `${name} mentioned increased pain this week affecting mobility. Sleep disrupted by discomfort. Mood was subdued but engaged in conversation. Suggested discussing pain management options with doctor.`,
    `${name} expressed frustration about health limitations. Reports difficulty with some daily tasks. Social contact has been limited to phone calls. Monitoring for further decline.`,
  ];
  return pick(templates);
}

function redSummary(name: string): string {
  const templates = [
    `${name} expressed feelings of hopelessness during the call. Reports not eating well for several days. Mentioned not seeing the point in daily activities. C-SSRS screening initiated. Emergency contact notified. Urgent follow-up scheduled.`,
    `${name} was withdrawn and spoke minimally. When prompted, acknowledged passive thoughts about not wanting to continue. Not sleeping well. Immediate escalation triggered. Care team and emergency contact alerted.`,
    `${name} reported worsening mood and isolation. Has not left bed for 2 days. Expressed feeling like a burden to family. PHQ-2 score elevated. Escalation initiated for urgent psychiatric follow-up.`,
  ];
  return pick(templates);
}

function comprehensiveSummary(name: string, flag: string): string {
  const base = flag === "red" ? redSummary(name) : flag === "yellow" ? yellowSummary(name) : greenSummary(name);
  return `[COMPREHENSIVE] ${base} Additional quarterly instruments administered: cognitive screening, fall risk, loneliness scale, and functional assessment completed.`;
}

// --- Assessment generators ---

function greenAssessment() {
  return {
    meals: randInt(4, 5),
    sleep: randInt(4, 5),
    health: randInt(4, 5),
    social: randInt(3, 5),
    mobility: randInt(4, 5),
    phq2Score: randInt(0, 2),
    phq2TriggeredCssrs: false,
    cssrsResult: "none" as const,
    ottawaScore: 4,
    flag: "green" as const,
  };
}

function yellowAssessment() {
  const phq2 = randInt(2, 4);
  const triggerCssrs = phq2 >= 3;
  return {
    meals: randInt(2, 4),
    sleep: randInt(2, 3),
    health: randInt(2, 4),
    social: randInt(2, 3),
    mobility: randInt(2, 4),
    phq2Score: phq2,
    phq2TriggeredCssrs: triggerCssrs,
    cssrsResult: triggerCssrs ? "passive_ideation" : "none",
    ottawaScore: randInt(3, 4),
    flag: "yellow" as const,
  };
}

function redAssessment() {
  return {
    meals: randInt(1, 3),
    sleep: randInt(1, 2),
    health: randInt(1, 3),
    social: randInt(1, 2),
    mobility: randInt(1, 3),
    phq2Score: randInt(3, 6),
    phq2TriggeredCssrs: true,
    cssrsResult: pick(["active_ideation", "passive_ideation"]),
    ottawaScore: randInt(1, 3),
    flag: "red" as const,
  };
}

function comprehensiveScores(flag: string) {
  if (flag === "green") {
    return {
      teleFreeCogScore: randInt(25, 30),
      steadiScore: randInt(8, 12),
      uclaLonelinessScore: randInt(3, 5),
      lawtonIadlScore: randInt(6, 8),
    };
  }
  if (flag === "yellow") {
    return {
      teleFreeCogScore: randInt(18, 25),
      steadiScore: randInt(4, 8),
      uclaLonelinessScore: randInt(5, 7),
      lawtonIadlScore: randInt(4, 6),
    };
  }
  return {
    teleFreeCogScore: randInt(12, 20),
    steadiScore: randInt(1, 5),
    uclaLonelinessScore: randInt(6, 9),
    lawtonIadlScore: randInt(2, 5),
  };
}

// --- Escalation generators ---

function yellowEscalations(): { tier: string; reason: string; details: string }[] {
  const pool = [
    {
      tier: "routine",
      reason: "PHQ-2 score elevated",
      details: "PHQ-2 score of 3 detected. Person reports low mood and decreased interest in activities. Recommend PCP follow-up within 1 week.",
    },
    {
      tier: "routine",
      reason: "Declining social engagement",
      details: "Person has not left home in over a week. Reports feeling isolated. Social worker referral recommended.",
    },
    {
      tier: "urgent",
      reason: "Repeated falls reported",
      details: "Person reports second fall this month. Mobility significantly reduced. Physical therapy and home safety assessment recommended.",
    },
    {
      tier: "routine",
      reason: "Nutritional concern",
      details: "Person reports eating only one meal per day for the past week. Weight loss suspected. Meals on Wheels referral suggested.",
    },
    {
      tier: "routine",
      reason: "Missed medical appointments",
      details: "Person has missed last two scheduled PCP appointments. Transportation may be a barrier. Care coordination recommended.",
    },
  ];
  const count = randInt(1, 2);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function redEscalations(): { tier: string; reason: string; details: string }[] {
  const pool = [
    {
      tier: "immediate",
      reason: "Active suicidal ideation detected",
      details: "C-SSRS screening revealed active suicidal ideation without plan. Person expressed desire not to wake up. Emergency contact notified. Psychiatric evaluation required within 24 hours.",
    },
    {
      tier: "immediate",
      reason: "Passive death wish expressed",
      details: "Person stated they would be better off dead during wellness call. No active plan identified. Emergency contact and PCP notified. Crisis line information provided.",
    },
    {
      tier: "urgent",
      reason: "Severe functional decline",
      details: "Person unable to perform basic ADLs. Has not left bed in 2 days. Not eating or drinking adequately. Home health assessment urgently needed.",
    },
    {
      tier: "urgent",
      reason: "PHQ-2 critical threshold exceeded",
      details: "PHQ-2 score of 5 detected. Person endorses depressed mood and anhedonia nearly every day. Urgent psychiatric referral initiated.",
    },
    {
      tier: "immediate",
      reason: "Safety concern - self-neglect",
      details: "Person reports not taking medications for 4 days and not caring about health. Expresses hopelessness. APS notification may be warranted. Emergency contact alerted.",
    },
  ];
  const count = randInt(2, 3);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// --- Main seed endpoint ---

seedRoutes.post("/", async (c) => {
  const userId = c.get("userId");

  // 1. Delete all existing persons for this user (cascade handles calls/assessments/escalations)
  await db.delete(schema.persons).where(eq(schema.persons.userId, userId));

  let totalPersons = 0;
  let totalCalls = 0;
  let totalAssessments = 0;
  let totalEscalations = 0;

  for (const profile of PERSON_PROFILES) {
    // 2. Create person
    const [person] = await db
      .insert(schema.persons)
      .values({
        userId,
        name: profile.name,
        phone: profile.phone,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactPhone: profile.emergencyContactPhone,
        pcpName: profile.pcpName,
        pcpPhone: profile.pcpPhone,
        notes: profile.notes,
        callSchedule: profile.callSchedule,
        agentName: pick(AGENT_NAMES),
        status: "active",
        flag: profile.targetFlag,
      })
      .returning();
    totalPersons++;

    // 3. Create historical calls spread over weeks
    const callCount = randInt(3, 8);
    const maxDaysBack = callCount * 8; // spread calls across enough time
    const callDays: number[] = [];

    // Generate sorted distinct day offsets
    for (let i = 0; i < callCount; i++) {
      const dayOffset = Math.round((maxDaysBack / callCount) * (callCount - i) - randInt(0, 3));
      callDays.push(Math.max(1, dayOffset));
    }
    callDays.sort((a, b) => b - a); // oldest first (highest days-ago first)

    let latestCallDate: Date | null = null;
    let completedCallCount = 0;

    for (let i = 0; i < callDays.length; i++) {
      const callDate = daysAgo(callDays[i]!);

      // Most calls completed, occasional failures
      const statusRoll = Math.random();
      let callStatus: string;
      if (i === callDays.length - 1) {
        // Most recent call is always completed for good demo data
        callStatus = "completed";
      } else if (statusRoll < 0.12) {
        callStatus = "no-answer";
      } else if (statusRoll < 0.18) {
        callStatus = "failed";
      } else {
        callStatus = "completed";
      }

      // Every ~13th call is comprehensive (roughly every 3 months worth)
      const isComprehensive = completedCallCount > 0 && completedCallCount % 4 === 0;
      const callType = isComprehensive ? "comprehensive" : "standard";

      const duration = callStatus === "completed" ? randInt(180, 480) : null;

      let summary: string | null = null;
      if (callStatus === "completed") {
        summary = isComprehensive
          ? comprehensiveSummary(profile.name, profile.targetFlag)
          : profile.targetFlag === "red"
            ? redSummary(profile.name)
            : profile.targetFlag === "yellow"
              ? yellowSummary(profile.name)
              : greenSummary(profile.name);
      }

      const completedAt = callStatus === "completed"
        ? new Date(callDate.getTime() + (duration ?? 0) * 1000)
        : callStatus === "no-answer"
          ? new Date(callDate.getTime() + 30000)
          : null;

      const [call] = await db
        .insert(schema.calls)
        .values({
          personId: person!.id,
          callType,
          callSource: "outbound",
          callSid: fakeCallSid(),
          status: callStatus,
          duration,
          summary,
          scheduledFor: callDate,
          startedAt: callDate,
          completedAt,
          errorMessage: callStatus === "failed" ? "Twilio error: call could not be connected" : null,
          createdAt: callDate,
        })
        .returning();
      totalCalls++;

      if (callStatus === "completed") {
        completedCallCount++;
        latestCallDate = callDate;

        // 4. Create assessment for completed calls
        const baseAssessment =
          profile.targetFlag === "red"
            ? redAssessment()
            : profile.targetFlag === "yellow"
              ? yellowAssessment()
              : greenAssessment();

        const compScores = isComprehensive ? comprehensiveScores(profile.targetFlag) : {};

        await db.insert(schema.assessments).values({
          callId: call!.id,
          personId: person!.id,
          ...baseAssessment,
          ...compScores,
          createdAt: completedAt ?? callDate,
        });
        totalAssessments++;
      }
    }

    // Update person with call stats
    await db
      .update(schema.persons)
      .set({
        lastCallAt: latestCallDate,
        callCount: completedCallCount,
      })
      .where(eq(schema.persons.id, person!.id));

    // 5. Create escalations for yellow/red persons
    if (profile.targetFlag === "yellow") {
      const escs = yellowEscalations();
      for (const esc of escs) {
        const escalationAge = randInt(1, 14);
        const isResolved = Math.random() < 0.3;
        const isAcknowledged = !isResolved && Math.random() < 0.5;

        await db.insert(schema.escalations).values({
          personId: person!.id,
          tier: esc.tier,
          reason: esc.reason,
          details: esc.details,
          status: isResolved ? "resolved" : isAcknowledged ? "acknowledged" : "pending",
          resolvedAt: isResolved ? daysAgo(randInt(0, escalationAge - 1)) : null,
          resolvedBy: isResolved ? userId : null,
          createdAt: daysAgo(escalationAge),
        });
        totalEscalations++;
      }
    }

    if (profile.targetFlag === "red") {
      const escs = redEscalations();
      for (const esc of escs) {
        const escalationAge = randInt(1, 7);
        const isResolved = Math.random() < 0.15;
        const isAcknowledged = !isResolved && Math.random() < 0.4;

        await db.insert(schema.escalations).values({
          personId: person!.id,
          tier: esc.tier,
          reason: esc.reason,
          details: esc.details,
          status: isResolved ? "resolved" : isAcknowledged ? "acknowledged" : "pending",
          resolvedAt: isResolved ? daysAgo(randInt(0, escalationAge - 1)) : null,
          resolvedBy: isResolved ? userId : null,
          createdAt: daysAgo(escalationAge),
        });
        totalEscalations++;
      }
    }
  }

  return c.json({
    ok: true,
    seeded: {
      persons: totalPersons,
      calls: totalCalls,
      assessments: totalAssessments,
      escalations: totalEscalations,
    },
  });
});

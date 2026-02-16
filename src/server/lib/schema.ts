import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// --- better-auth tables ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- App tables ---

export const persons = pgTable("persons", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  pcpName: text("pcp_name"),
  pcpPhone: text("pcp_phone"),
  notes: text("notes"),
  agentName: text("agent_name"), // Persistent AI caller name for this person
  // Call schedule = how often to call (frequency). See constants.ts for intervals.
  // twice-weekly: CLOVA CareCall protocol (high-risk, red-flagged, post-event) — 3 days
  // weekly: Standard ongoing monitoring (most-studied frequency) — 7 days
  // biweekly: Stable green-flagged persons — 14 days
  // Call TYPE (standard/comprehensive/check-in) is determined per-call, not here.
  callSchedule: text("call_schedule").default("weekly"),
  status: text("status").default("active"), // active, paused, discharged
  flag: text("flag").default("green"), // green, yellow, red
  lastCallAt: timestamp("last_call_at"),
  callCount: integer("call_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const calls = pgTable("calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  callType: text("call_type").notNull().default("standard"), // standard, comprehensive, check-in
  callSource: text("call_source").default("outbound"), // outbound, inbound
  callSid: text("call_sid"),
  status: text("status").default("scheduled"), // scheduled, in-progress, completed, failed, no-answer, voicemail
  retryCount: integer("retry_count").default(0),
  duration: integer("duration"),
  recordingUrl: text("recording_url"),
  enrichedTranscript: jsonb("enriched_transcript"),
  transcriptSid: text("transcript_sid"),
  summary: text("summary"),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  // CLOVA 5 metrics (1-5)
  meals: integer("meals"),
  sleep: integer("sleep"),
  health: integer("health"),
  social: integer("social"),
  mobility: integer("mobility"),
  // PHQ-2 (0-6)
  phq2Score: integer("phq2_score"),
  phq2TriggeredCssrs: boolean("phq2_triggered_cssrs").default(false),
  cssrsResult: text("cssrs_result"),
  // Ottawa 3DY (0-4)
  ottawaScore: integer("ottawa_score"),
  // Comprehensive-only instruments
  teleFreeCogScore: integer("tele_free_cog_score"),
  steadiScore: integer("steadi_score"),
  uclaLonelinessScore: integer("ucla_loneliness_score"),
  lawtonIadlScore: integer("lawton_iadl_score"),
  // Computed
  flag: text("flag").default("green"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escalations = pgTable("escalations", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  callId: uuid("call_id").references(() => calls.id),
  tier: text("tier").notNull(), // immediate, urgent, routine
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("pending"), // pending, acknowledged, resolved
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const persons = pgTable("persons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  pcpName: text("pcp_name"),
  pcpPhone: text("pcp_phone"),
  notes: text("notes"),
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
  callType: text("call_type").notNull().default("weekly"), // weekly, quarterly
  callSid: text("call_sid"),
  status: text("status").default("scheduled"), // scheduled, in-progress, completed, failed, no-answer
  duration: integer("duration"),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
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
  // Quarterly instruments
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

/**
 * Test script: Initiates a real Twilio call to TEST_PHONE_NUMBER.
 *
 * Usage:
 *   bun run test:call
 *
 * Requires: DATABASE_URL, TWILIO_*, ANTHROPIC_API_KEY set in .env
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../server/lib/schema.ts";
import { env } from "../server/env.ts";
import Twilio from "twilio";

const TEST_PHONE = process.env.TEST_PHONE_NUMBER ?? "+19083363673";

// ── Validate required env vars (loud failures) ───────────────────────
const required = {
  DATABASE_URL: env.DATABASE_URL,
  TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER,
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
  BASE_URL: env.BASE_URL,
} as const;

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    console.error(`FATAL: ${key} is not set. Cannot run test call.`);
    process.exit(1);
  }
}

// ── Connect to database ──────────────────────────────────────────────
const driver = postgres(env.DATABASE_URL);
const db = drizzle({ client: driver, schema, casing: "snake_case" });

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       claudecare — Test Call Script      ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  Phone:    ${TEST_PHONE}`);
  console.log(`  Base URL: ${env.BASE_URL}`);
  console.log(`  Twilio #: ${env.TWILIO_PHONE_NUMBER}`);
  console.log();

  // ── Step 1: Upsert test person ───────────────────────────────────
  console.log("[1/4] Finding or creating test person...");

  let [person] = await db
    .select()
    .from(schema.persons)
    .where(eq(schema.persons.phone, TEST_PHONE));

  if (!person) {
    [person] = await db
      .insert(schema.persons)
      .values({
        name: "Test User",
        phone: TEST_PHONE,
        status: "active",
        flag: "green",
        notes: "Auto-created by test:call script",
      })
      .returning();
    console.log(`  Created test person: ${person!.id}`);
  } else {
    // Ensure the person is active
    if (person.status !== "active") {
      await db
        .update(schema.persons)
        .set({ status: "active" })
        .where(eq(schema.persons.id, person.id));
      console.log(`  Reactivated test person: ${person.id}`);
    } else {
      console.log(`  Found existing test person: ${person.id} (${person.name})`);
    }
  }

  // ── Step 2: Create call record ───────────────────────────────────
  console.log("[2/4] Creating call record...");

  const [call] = await db
    .insert(schema.calls)
    .values({
      personId: person!.id,
      callType: "weekly",
      status: "scheduled",
      scheduledFor: new Date(),
    })
    .returning();

  console.log(`  Call ID: ${call!.id}`);

  // ── Step 3: Initiate Twilio call ─────────────────────────────────
  console.log("[3/4] Initiating Twilio call...");

  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const voiceUrl = `${env.BASE_URL}/api/twilio/voice/answer?personId=${person!.id}&callSid=${call!.id}`;
  const statusUrl = `${env.BASE_URL}/api/twilio/status`;
  const recordingUrl = `${env.BASE_URL}/api/twilio/recording`;

  console.log(`  Voice URL: ${voiceUrl}`);

  const twilioCall = await client.calls.create({
    to: TEST_PHONE,
    from: env.TWILIO_PHONE_NUMBER,
    url: voiceUrl,
    statusCallback: statusUrl,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    record: true,
    recordingStatusCallback: recordingUrl,
  });

  // Update call record with Twilio SID
  await db
    .update(schema.calls)
    .set({ callSid: twilioCall.sid, status: "in-progress" })
    .where(eq(schema.calls.id, call!.id));

  console.log(`  Twilio SID: ${twilioCall.sid}`);

  // ── Step 4: Done ─────────────────────────────────────────────────
  console.log("[4/4] Call initiated successfully!");
  console.log();
  console.log("  Your phone should ring momentarily.");
  console.log("  The server must be running (bun run dev) to handle the WebSocket.");
  console.log();
  console.log(`  Monitor logs with: bun run dev`);
  console.log(`  Check call status: GET /api/calls/${call!.id}`);

  await driver.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

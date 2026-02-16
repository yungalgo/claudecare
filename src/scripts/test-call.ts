/**
 * Test script: Triggers a real call via the running dev server.
 *
 * Usage:
 *   1. Start the server: bun run dev
 *   2. In another terminal: bun run test:call
 *
 * Requires: All env vars set in .env, server running with ngrok
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../server/lib/schema.ts";
import { env } from "../server/env.ts";

const TEST_PHONE = process.env.TEST_PHONE_NUMBER ?? "+19083363673";
const serverUrl = `http://localhost:${env.PORT}`;

// ── Connect to database ──────────────────────────────────────────────
const driver = postgres(env.DATABASE_URL);
const db = drizzle({ client: driver, schema, casing: "snake_case" });

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       claudecare — Test Call Script      ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  Phone:    ${TEST_PHONE}`);
  console.log(`  Server:   ${serverUrl}`);
  console.log(`  Twilio #: ${env.TWILIO_PHONE_NUMBER}`);
  console.log();

  // ── Step 1: Ensure a user exists ─────────────────────────────────
  console.log("[1/3] Ensuring test user exists...");

  let [testUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, "test@claudecare.com"));

  if (!testUser) {
    [testUser] = await db
      .insert(schema.user)
      .values({
        id: "test-user-id",
        name: "Test Admin",
        email: "test@claudecare.com",
        emailVerified: true,
      })
      .returning();
    console.log(`  Created test user: ${testUser!.id}`);
  } else {
    console.log(`  Found test user: ${testUser.id}`);
  }

  // ── Step 2: Ensure test person exists ────────────────────────────
  console.log("[2/3] Ensuring test person exists...");

  let [person] = await db
    .select()
    .from(schema.persons)
    .where(eq(schema.persons.phone, TEST_PHONE));

  if (!person) {
    [person] = await db
      .insert(schema.persons)
      .values({
        userId: testUser!.id,
        name: "Test User",
        phone: TEST_PHONE,
        status: "active",
        flag: "green",
        notes: "Auto-created by test:call script",
      })
      .returning();
    console.log(`  Created test person: ${person!.id}`);
  } else {
    if (person.status !== "active" || person.userId !== testUser!.id) {
      await db
        .update(schema.persons)
        .set({ status: "active", userId: testUser!.id })
        .where(eq(schema.persons.id, person.id));
    }
    console.log(`  Found test person: ${person.id} (${person.name})`);
  }

  // ── Step 3: Trigger call via dev endpoint ────────────────────────
  console.log("[3/3] Triggering call...");

  const res = await fetch(`${serverUrl}/api/dev/trigger-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personId: person!.id }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FATAL: Server returned ${res.status}: ${err}`);
    console.error("  Is the server running? (bun run dev)");
    await driver.end();
    process.exit(1);
  }

  const call = (await res.json()) as { id: string };
  console.log(`  Call ID: ${call.id}`);
  console.log();
  console.log("  Your phone should ring momentarily.");
  console.log("  Watch the server logs for WS/Claude activity.");

  await driver.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("FATAL:", err);
  await driver.end();
  process.exit(1);
});

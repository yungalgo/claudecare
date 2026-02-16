import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, and } from "drizzle-orm";
import { getBoss } from "../jobs/boss.ts";
import type { AppVariables } from "../types.ts";

export const callRoutes = new Hono<{ Variables: AppVariables }>();

// Helper: verify personId belongs to current user
async function verifyPersonOwnership(personId: string, userId: string): Promise<boolean> {
  const [person] = await db
    .select({ id: schema.persons.id })
    .from(schema.persons)
    .where(and(eq(schema.persons.id, personId), eq(schema.persons.userId, userId)));
  return !!person;
}

// List calls (optionally filter by personId) — ownership check
callRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const personId = c.req.query("personId");

  if (personId) {
    if (!(await verifyPersonOwnership(personId, userId))) {
      return c.json({ error: "Person not found" }, 404);
    }
    const calls = await db
      .select()
      .from(schema.calls)
      .where(eq(schema.calls.personId, personId))
      .orderBy(desc(schema.calls.createdAt))
      .limit(100);
    return c.json(calls);
  }

  // No personId filter — return calls for all of this user's persons
  const calls = await db
    .select({ call: schema.calls, personName: schema.persons.name })
    .from(schema.calls)
    .innerJoin(schema.persons, eq(schema.calls.personId, schema.persons.id))
    .where(eq(schema.persons.userId, userId))
    .orderBy(desc(schema.calls.createdAt))
    .limit(100);

  return c.json(calls);
});

// Get single call — ownership check
callRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [result] = await db
    .select({ call: schema.calls })
    .from(schema.calls)
    .innerJoin(schema.persons, eq(schema.calls.personId, schema.persons.id))
    .where(and(eq(schema.calls.id, id), eq(schema.persons.userId, userId)));

  if (!result) return c.json({ error: "Call not found" }, 404);
  return c.json(result.call);
});

// Trigger manual call for a person — ownership check
callRoutes.post("/trigger", async (c) => {
  const userId = c.get("userId");
  const { personId, callType } = await c.req.json();

  if (!(await verifyPersonOwnership(personId, userId))) {
    return c.json({ error: "Person not found" }, 404);
  }

  // Create call record
  const [call] = await db
    .insert(schema.calls)
    .values({
      personId,
      callType: callType ?? "weekly",
      status: "scheduled",
      scheduledFor: new Date(),
    })
    .returning();

  // Queue Twilio call via pg-boss
  const boss = await getBoss();
  await boss.send("process-call", { callId: call.id });

  return c.json(call, 201);
});

import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc } from "drizzle-orm";

export const callRoutes = new Hono();

// List calls (optionally filter by personId)
callRoutes.get("/", async (c) => {
  const personId = c.req.query("personId");

  let query = db.select().from(schema.calls).$dynamic();

  if (personId) {
    query = query.where(eq(schema.calls.personId, personId));
  }

  const calls = await query.orderBy(desc(schema.calls.createdAt)).limit(100);
  return c.json(calls);
});

// Get single call
callRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [call] = await db.select().from(schema.calls).where(eq(schema.calls.id, id));
  if (!call) return c.json({ error: "Call not found" }, 404);
  return c.json(call);
});

// Trigger manual call for a person
callRoutes.post("/trigger", async (c) => {
  const { personId, callType } = await c.req.json();

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

  // TODO: Queue Twilio call via pg-boss
  // await boss.send("process-call", { callId: call.id });

  return c.json(call, 201);
});

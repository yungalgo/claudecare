import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, and } from "drizzle-orm";
import type { AppVariables } from "../types.ts";

export const escalationRoutes = new Hono<{ Variables: AppVariables }>();

// List escalations (filter by status) — scoped to user's persons
escalationRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const status = c.req.query("status");
  const personId = c.req.query("personId");

  const conditions = [eq(schema.persons.userId, userId)];
  if (status) conditions.push(eq(schema.escalations.status, status));
  if (personId) conditions.push(eq(schema.escalations.personId, personId));

  const escalations = await db
    .select({
      escalation: schema.escalations,
      personName: schema.persons.name,
      personPhone: schema.persons.phone,
    })
    .from(schema.escalations)
    .innerJoin(schema.persons, eq(schema.escalations.personId, schema.persons.id))
    .where(and(...conditions))
    .orderBy(desc(schema.escalations.createdAt))
    .limit(100);

  return c.json(escalations);
});

// Acknowledge escalation — ownership check
escalationRoutes.patch("/:id/acknowledge", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  // Verify ownership through person
  const [esc] = await db
    .select({ id: schema.escalations.id })
    .from(schema.escalations)
    .innerJoin(schema.persons, eq(schema.escalations.personId, schema.persons.id))
    .where(and(eq(schema.escalations.id, id), eq(schema.persons.userId, userId)));
  if (!esc) return c.json({ error: "Escalation not found" }, 404);

  const [escalation] = await db
    .update(schema.escalations)
    .set({ status: "acknowledged" })
    .where(eq(schema.escalations.id, id))
    .returning();

  return c.json(escalation);
});

// Resolve escalation — ownership check, resolvedBy from session
escalationRoutes.patch("/:id/resolve", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  // Verify ownership through person
  const [esc] = await db
    .select({ id: schema.escalations.id })
    .from(schema.escalations)
    .innerJoin(schema.persons, eq(schema.escalations.personId, schema.persons.id))
    .where(and(eq(schema.escalations.id, id), eq(schema.persons.userId, userId)));
  if (!esc) return c.json({ error: "Escalation not found" }, 404);

  const [escalation] = await db
    .update(schema.escalations)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: userId,
    })
    .where(eq(schema.escalations.id, id))
    .returning();

  return c.json(escalation);
});

import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, and } from "drizzle-orm";

export const escalationRoutes = new Hono();

// List escalations (filter by status)
escalationRoutes.get("/", async (c) => {
  const status = c.req.query("status"); // pending, acknowledged, resolved
  const personId = c.req.query("personId");

  let query = db
    .select({
      escalation: schema.escalations,
      personName: schema.persons.name,
      personPhone: schema.persons.phone,
    })
    .from(schema.escalations)
    .leftJoin(schema.persons, eq(schema.escalations.personId, schema.persons.id))
    .$dynamic();

  const conditions = [];
  if (status) conditions.push(eq(schema.escalations.status, status));
  if (personId) conditions.push(eq(schema.escalations.personId, personId));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const escalations = await query.orderBy(desc(schema.escalations.createdAt)).limit(100);
  return c.json(escalations);
});

// Acknowledge escalation
escalationRoutes.patch("/:id/acknowledge", async (c) => {
  const id = c.req.param("id");
  const [escalation] = await db
    .update(schema.escalations)
    .set({ status: "acknowledged" })
    .where(eq(schema.escalations.id, id))
    .returning();
  if (!escalation) return c.json({ error: "Escalation not found" }, 404);
  return c.json(escalation);
});

// Resolve escalation
escalationRoutes.patch("/:id/resolve", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const [escalation] = await db
    .update(schema.escalations)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: body.resolvedBy ?? "admin",
    })
    .where(eq(schema.escalations.id, id))
    .returning();
  if (!escalation) return c.json({ error: "Escalation not found" }, 404);
  return c.json(escalation);
});

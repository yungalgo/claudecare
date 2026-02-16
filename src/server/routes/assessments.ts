import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, and } from "drizzle-orm";
import type { AppVariables } from "../types.ts";

export const assessmentRoutes = new Hono<{ Variables: AppVariables }>();

// List assessments for a person (trend data) — ownership check
assessmentRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const personId = c.req.query("personId");
  if (!personId) return c.json({ error: "personId required" }, 400);

  // Verify person belongs to user
  const [person] = await db
    .select({ id: schema.persons.id })
    .from(schema.persons)
    .where(and(eq(schema.persons.id, personId), eq(schema.persons.userId, userId)));
  if (!person) return c.json({ error: "Person not found" }, 404);

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.personId, personId))
    .orderBy(desc(schema.assessments.createdAt))
    .limit(52); // ~1 year of weekly data

  return c.json(assessments);
});

// Get single assessment — ownership check
assessmentRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [result] = await db
    .select({ assessment: schema.assessments })
    .from(schema.assessments)
    .innerJoin(schema.persons, eq(schema.assessments.personId, schema.persons.id))
    .where(and(eq(schema.assessments.id, id), eq(schema.persons.userId, userId)));

  if (!result) return c.json({ error: "Assessment not found" }, 404);
  return c.json(result.assessment);
});

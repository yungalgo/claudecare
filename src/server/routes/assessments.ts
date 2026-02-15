import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc } from "drizzle-orm";

export const assessmentRoutes = new Hono();

// List assessments for a person (trend data)
assessmentRoutes.get("/", async (c) => {
  const personId = c.req.query("personId");
  if (!personId) return c.json({ error: "personId required" }, 400);

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.personId, personId))
    .orderBy(desc(schema.assessments.createdAt))
    .limit(52); // ~1 year of weekly data

  return c.json(assessments);
});

// Get single assessment
assessmentRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [assessment] = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.id, id));
  if (!assessment) return c.json({ error: "Assessment not found" }, 404);
  return c.json(assessment);
});

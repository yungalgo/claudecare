import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, like, or, and, count } from "drizzle-orm";
import { z } from "zod/v4";
import type { AppVariables } from "../types.ts";
import { seedForUser } from "./seed.ts";

export const personRoutes = new Hono<{ Variables: AppVariables }>();

// Warm, friendly names for the AI caller — assigned consistently per person
const AGENT_NAMES = [
  "Sarah", "Eleanor", "Dorothy", "Helen", "Ruth",
  "Betty", "Patricia", "Linda", "Barbara", "Margaret",
  "Virginia", "Catherine", "Frances", "Alice", "Jean",
];

function pickAgentName(): string {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]!;
}

// List all persons (with optional search) — scoped to user
// Auto-seeds demo data on first access so the app feels pre-populated for judges
personRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const search = c.req.query("search");
  const status = c.req.query("status") ?? "active";

  // Auto-seed if user has zero persons (first login)
  const [row] = await db
    .select({ total: count() })
    .from(schema.persons)
    .where(eq(schema.persons.userId, userId));

  if (!row || row.total === 0) {
    await seedForUser(userId);
  }

  const conditions = [eq(schema.persons.userId, userId)];

  if (status !== "all") {
    conditions.push(eq(schema.persons.status, status));
  }

  if (search) {
    const escaped = search.replace(/[%_]/g, "\\$&");
    conditions.push(
      or(
        like(schema.persons.name, `%${escaped}%`),
        like(schema.persons.phone, `%${escaped}%`),
      )!,
    );
  }

  const persons = await db
    .select()
    .from(schema.persons)
    .where(and(...conditions))
    .orderBy(desc(schema.persons.updatedAt));

  return c.json(persons);
});

// Get single person — scoped to user
personRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const [person] = await db
    .select()
    .from(schema.persons)
    .where(and(eq(schema.persons.id, id), eq(schema.persons.userId, userId)));
  if (!person) return c.json({ error: "Person not found" }, 404);
  return c.json(person);
});

const createPersonSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  pcpName: z.string().optional(),
  pcpPhone: z.string().optional(),
  notes: z.string().optional(),
});

// Create person — assigned to user
personRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = createPersonSchema.parse(body);
  const [person] = await db.insert(schema.persons).values({ ...data, userId, agentName: pickAgentName() }).returning();
  return c.json(person, 201);
});

// Update person — scoped to user
personRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();
  const data = createPersonSchema.partial().parse(body);
  const [person] = await db
    .update(schema.persons)
    .set(data)
    .where(and(eq(schema.persons.id, id), eq(schema.persons.userId, userId)))
    .returning();
  if (!person) return c.json({ error: "Person not found" }, 404);
  return c.json(person);
});

// Delete person — scoped to user
personRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const result = await db
    .delete(schema.persons)
    .where(and(eq(schema.persons.id, id), eq(schema.persons.userId, userId)));
  return c.json({ ok: true });
});

// CSV upload — bulk create persons — assigned to user
personRoutes.post("/upload", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const rows = z.array(createPersonSchema).parse(body.rows);
  const values = rows.map((r) => ({ ...r, userId, agentName: pickAgentName() }));
  const inserted = await db.insert(schema.persons).values(values).returning();
  return c.json({ count: inserted.length, persons: inserted }, 201);
});

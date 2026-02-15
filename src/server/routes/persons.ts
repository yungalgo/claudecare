import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, desc, like, or } from "drizzle-orm";
import { z } from "zod/v4";

export const personRoutes = new Hono();

// List all persons (with optional search)
personRoutes.get("/", async (c) => {
  const search = c.req.query("search");
  const status = c.req.query("status") ?? "active";

  let query = db.select().from(schema.persons).$dynamic();

  if (status !== "all") {
    query = query.where(eq(schema.persons.status, status));
  }

  if (search) {
    query = query.where(
      or(
        like(schema.persons.name, `%${search}%`),
        like(schema.persons.phone, `%${search}%`),
      ),
    );
  }

  const persons = await query.orderBy(desc(schema.persons.updatedAt));
  return c.json(persons);
});

// Get single person
personRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [person] = await db.select().from(schema.persons).where(eq(schema.persons.id, id));
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

// Create person
personRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const data = createPersonSchema.parse(body);
  const [person] = await db.insert(schema.persons).values(data).returning();
  return c.json(person, 201);
});

// Update person
personRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const [person] = await db
    .update(schema.persons)
    .set(body)
    .where(eq(schema.persons.id, id))
    .returning();
  if (!person) return c.json({ error: "Person not found" }, 404);
  return c.json(person);
});

// Delete person
personRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(schema.persons).where(eq(schema.persons.id, id));
  return c.json({ ok: true });
});

// CSV upload — bulk create persons
personRoutes.post("/upload", async (c) => {
  const body = await c.req.json();
  const rows = z.array(createPersonSchema).parse(body.rows);
  const inserted = await db.insert(schema.persons).values(rows).returning();
  return c.json({ count: inserted.length, persons: inserted }, 201);
});

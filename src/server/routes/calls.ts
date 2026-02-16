import { Hono } from "hono";
import { z } from "zod/v4";
import { db, schema } from "../lib/db.ts";
import { eq, desc, and } from "drizzle-orm";
import { getBoss } from "../jobs/boss.ts";
import { env } from "../env.ts";
import { CALL_TYPES } from "../lib/constants.ts";
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

// Stream recording audio — proxies from Twilio with server-side auth
callRoutes.get("/:id/recording", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [result] = await db
    .select({ call: schema.calls })
    .from(schema.calls)
    .innerJoin(schema.persons, eq(schema.calls.personId, schema.persons.id))
    .where(and(eq(schema.calls.id, id), eq(schema.persons.userId, userId)));

  if (!result?.call.recordingUrl) {
    return c.json({ error: "Recording not found" }, 404);
  }

  // Twilio recording URL — append .mp3 for compressed audio
  const twilioUrl = result.call.recordingUrl + ".mp3";
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const upstream = await fetch(twilioUrl, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!upstream.ok) {
    return c.json({ error: "Failed to fetch recording" }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": upstream.headers.get("Content-Length") ?? "",
      "Cache-Control": "private, max-age=3600",
    },
  });
});

// Trigger manual call for a person — ownership check
const triggerSchema = z.object({
  personId: z.uuid(),
  callType: z.enum([CALL_TYPES.STANDARD, CALL_TYPES.COMPREHENSIVE]).optional(),
});

callRoutes.post("/trigger", async (c) => {
  const userId = c.get("userId");
  const parsed = triggerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }
  const { personId, callType } = parsed.data;

  if (!(await verifyPersonOwnership(personId, userId))) {
    return c.json({ error: "Person not found" }, 404);
  }

  // Create call record
  const [call] = await db
    .insert(schema.calls)
    .values({
      personId,
      callType: callType ?? CALL_TYPES.STANDARD,
      status: "scheduled",
      scheduledFor: new Date(),
    })
    .returning();

  // Queue Twilio call via pg-boss
  const boss = await getBoss();
  await boss.send("process-call", { callId: call!.id });

  return c.json(call, 201);
});

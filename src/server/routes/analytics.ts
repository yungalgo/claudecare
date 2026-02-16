import { Hono } from "hono";
import { db, schema } from "../lib/db.ts";
import { eq, and, gte, sql, count, avg } from "drizzle-orm";
import type { AppVariables } from "../types.ts";

export const analyticsRoutes = new Hono<{ Variables: AppVariables }>();

analyticsRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // All person IDs for this user
  const userPersons = db
    .select({ id: schema.persons.id })
    .from(schema.persons)
    .where(eq(schema.persons.userId, userId));

  // --- Call stats ---
  const [callStats] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${schema.calls.status} = 'completed')`,
      last24h: sql<number>`count(*) filter (where ${schema.calls.createdAt} >= ${h24})`,
      last48h: sql<number>`count(*) filter (where ${schema.calls.createdAt} >= ${h48})`,
      last7d: sql<number>`count(*) filter (where ${schema.calls.createdAt} >= ${d7})`,
    })
    .from(schema.calls)
    .where(sql`${schema.calls.personId} in (${userPersons})`);

  const completionRate =
    callStats!.total > 0
      ? Math.round((callStats!.completed / callStats!.total) * 100)
      : 0;

  // --- Average duration ---
  const [avgDuration] = await db
    .select({
      avg7d: sql<number>`avg(${schema.calls.duration}) filter (where ${schema.calls.completedAt} >= ${d7})`,
      avg30d: sql<number>`avg(${schema.calls.duration}) filter (where ${schema.calls.completedAt} >= ${d30})`,
    })
    .from(schema.calls)
    .where(
      and(
        sql`${schema.calls.personId} in (${userPersons})`,
        eq(schema.calls.status, "completed"),
      ),
    );

  // --- Persons called ---
  const [personsCalled] = await db
    .select({
      last24h: sql<number>`count(distinct ${schema.calls.personId}) filter (where ${schema.calls.createdAt} >= ${h24})`,
      last48h: sql<number>`count(distinct ${schema.calls.personId}) filter (where ${schema.calls.createdAt} >= ${h48})`,
      last7d: sql<number>`count(distinct ${schema.calls.personId}) filter (where ${schema.calls.createdAt} >= ${d7})`,
    })
    .from(schema.calls)
    .where(sql`${schema.calls.personId} in (${userPersons})`);

  // --- Flag distribution ---
  const flagDist = await db
    .select({
      flag: schema.persons.flag,
      count: count(),
    })
    .from(schema.persons)
    .where(eq(schema.persons.userId, userId))
    .groupBy(schema.persons.flag);

  // --- Average assessment scores (last 30 days) ---
  const [avgScores] = await db
    .select({
      meals: avg(schema.assessments.meals),
      sleep: avg(schema.assessments.sleep),
      health: avg(schema.assessments.health),
      social: avg(schema.assessments.social),
      mobility: avg(schema.assessments.mobility),
      phq2: avg(schema.assessments.phq2Score),
      ottawa: avg(schema.assessments.ottawaScore),
    })
    .from(schema.assessments)
    .where(
      and(
        sql`${schema.assessments.personId} in (${userPersons})`,
        gte(schema.assessments.createdAt, d30),
      ),
    );

  // --- Call volume by day (last 30 days) ---
  const callVolume = await db
    .select({
      date: sql<string>`date_trunc('day', ${schema.calls.createdAt})::date`,
      count: count(),
    })
    .from(schema.calls)
    .where(
      and(
        sql`${schema.calls.personId} in (${userPersons})`,
        gte(schema.calls.createdAt, d30),
      ),
    )
    .groupBy(sql`date_trunc('day', ${schema.calls.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${schema.calls.createdAt})::date`);

  return c.json({
    calls: {
      total: callStats!.total,
      completed: callStats!.completed,
      last24h: callStats!.last24h,
      last48h: callStats!.last48h,
      last7d: callStats!.last7d,
      completionRate,
    },
    avgDuration: {
      last7d: Math.round(avgDuration?.avg7d ?? 0),
      last30d: Math.round(avgDuration?.avg30d ?? 0),
    },
    personsCalled: {
      last24h: personsCalled!.last24h,
      last48h: personsCalled!.last48h,
      last7d: personsCalled!.last7d,
    },
    flagDistribution: Object.fromEntries(flagDist.map((f) => [f.flag ?? "green", f.count])),
    avgScores: avgScores
      ? {
          meals: Number(Number(avgScores.meals ?? 0).toFixed(1)),
          sleep: Number(Number(avgScores.sleep ?? 0).toFixed(1)),
          health: Number(Number(avgScores.health ?? 0).toFixed(1)),
          social: Number(Number(avgScores.social ?? 0).toFixed(1)),
          mobility: Number(Number(avgScores.mobility ?? 0).toFixed(1)),
          phq2: Number(Number(avgScores.phq2 ?? 0).toFixed(1)),
          ottawa: Number(Number(avgScores.ottawa ?? 0).toFixed(1)),
        }
      : null,
    callVolume,
  });
});

import { PgBoss } from "pg-boss";
import { scheduleNextCall } from "./scheduler.ts";
import { processCall } from "./call-processor.ts";
import { processPostCall } from "./post-call.ts";
import { env } from "../env.ts";

let boss: PgBoss | null = null;

async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL required for pg-boss");

  boss = new PgBoss(dbUrl);
  await boss.start();
  console.log("[pg-boss] Started");
  return boss;
}

export async function startWorkers() {
  const b = await getBoss();

  // Create queues (idempotent)
  await b.createQueue("schedule-calls");
  await b.createQueue("process-call");
  await b.createQueue("post-call");
  await b.createQueue("process-next-call");

  // Parse cron from CALL_WINDOW_START (e.g. "09:00" → "0 9 * * *")
  const [hour, minute] = env.CALL_WINDOW_START.split(":").map(Number);
  const cronExpression = `${minute} ${hour} * * *`;

  // Cron: schedule daily call window start
  await b.schedule("schedule-calls", cronExpression);
  await b.work("schedule-calls", async () => {
    console.log("[job:schedule-calls] Starting daily call window");
    await scheduleNextCall(b);
  });

  // Process individual calls
  await b.work("process-call", async ([job]) => {
    const { callId } = job!.data as { callId: string };
    console.log(`[job:process-call] Processing call ${callId}`);
    await processCall(callId);
  });

  // Post-call processing (scoring, flagging, escalation)
  // After finishing, queues process-next-call with delay
  await b.work("post-call", async ([job]) => {
    const { callId } = job!.data as { callId: string };
    console.log(`[job:post-call] Processing post-call ${callId}`);
    await processPostCall(callId);

    // Chain: schedule next call immediately
    await b.send("process-next-call", {});
    console.log("[job:post-call] Queued next call");
  });

  // Process next call in the sequential chain
  await b.work("process-next-call", async () => {
    console.log("[job:process-next-call] Checking for next call");
    await scheduleNextCall(b);
  });

  console.log("[pg-boss] Workers registered");
}

export { getBoss };

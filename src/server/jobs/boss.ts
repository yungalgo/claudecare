import { PgBoss } from "pg-boss";
import { scheduleCallBatches } from "./scheduler.ts";
import { processCall } from "./call-processor.ts";
import { processPostCall } from "./post-call.ts";

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

  // Cron: schedule daily call batches at 9 AM
  await b.schedule("schedule-calls", "0 9 * * *");
  await b.work("schedule-calls", async () => {
    console.log("[job:schedule-calls] Running daily call scheduler");
    await scheduleCallBatches(b);
  });

  // Process individual calls
  await b.work("process-call", async (job) => {
    const { callId } = job.data as { callId: string };
    console.log(`[job:process-call] Processing call ${callId}`);
    await processCall(callId);
  });

  // Post-call processing (scoring, flagging, escalation)
  await b.work("post-call", async (job) => {
    const { callId } = job.data as { callId: string };
    console.log(`[job:post-call] Processing post-call ${callId}`);
    await processPostCall(callId);
  });

  console.log("[pg-boss] Workers registered");
}

export { getBoss };

import { db, schema } from "../lib/db.ts";
import { eq } from "drizzle-orm";
import { scoreAssessment } from "../lib/scoring.ts";
import { createEscalation } from "../lib/escalation.ts";
import { env } from "../env.ts";

export async function processPostCall(callId: string) {
  const [call] = await db.select().from(schema.calls).where(eq(schema.calls.id, callId));
  if (!call) {
    throw new Error(`[post-call] Call ${callId} not found`);
  }

  // Fetch enriched transcript from Twilio Intelligence (async, non-blocking)
  if (env.TWILIO_INTELLIGENCE_SERVICE_SID && call.callSid) {
    fetchAndStoreEnrichedTranscript(callId, call.callSid);
  }

  // Update person lastCallAt regardless of assessment
  await db
    .update(schema.persons)
    .set({ lastCallAt: new Date() })
    .where(eq(schema.persons.id, call.personId));

  // Get the assessment created during the call
  const [assessment] = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.callId, callId));

  if (!assessment) {
    // Incomplete call — no assessment submitted. This is expected for short calls.
    console.log(`[post-call] No assessment for call ${callId} (incomplete call, ${call.duration ?? 0}s)`);
    return;
  }

  // Re-score and flag
  const result = scoreAssessment(assessment);

  // Update assessment flag
  await db
    .update(schema.assessments)
    .set({ flag: result.flag })
    .where(eq(schema.assessments.id, assessment.id));

  // Update person flag
  await db
    .update(schema.persons)
    .set({ flag: result.flag })
    .where(eq(schema.persons.id, call.personId));

  // Create escalations as needed
  for (const esc of result.escalations) {
    await createEscalation({
      personId: call.personId,
      callId,
      tier: esc.tier,
      reason: esc.reason,
      details: esc.details,
    });
  }

  console.log(`[post-call] Call ${callId}: flag=${result.flag}, escalations=${result.escalations.length}`);
}

/**
 * Fetch enriched transcript from Twilio Intelligence by looking up transcripts
 * for the call SID. Retries with backoff since the transcript may still be
 * processing when the call first completes.
 */
async function fetchAndStoreEnrichedTranscript(callId: string, callSid: string) {
  const { fetchEnrichedTranscript } = await import("../lib/intelligence.ts");
  const { default: Twilio } = await import("twilio");
  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const MAX_ATTEMPTS = 4;
  const DELAYS = [5_000, 10_000, 20_000, 30_000]; // 5s, 10s, 20s, 30s

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, DELAYS[attempt]!));

    try {
      // Find transcripts for this call — prefer Recording (timestamps align with audio)
      const transcripts = await client.intelligence.v2.transcripts.list({ limit: 20 });
      const candidates = transcripts.filter((t) => {
        const refs = (t.channel as any)?.media_properties?.reference_sids;
        return refs?.call_sid === callSid;
      });
      const match = candidates.find((t) => (t.channel as any)?.media_properties?.source === "Recording")
        ?? candidates[0];

      if (!match) {
        console.log(`[post-call:intelligence] No transcript yet for ${callSid} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
        continue;
      }

      if (match.status !== "completed") {
        console.log(`[post-call:intelligence] Transcript ${match.sid} status=${match.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
        continue;
      }

      const enriched = await fetchEnrichedTranscript(match.sid);

      await db
        .update(schema.calls)
        .set({ enrichedTranscript: enriched, transcriptSid: match.sid })
        .where(eq(schema.calls.id, callId));

      console.log(`[post-call:intelligence] Enriched transcript saved for call ${callId} (${enriched.sentences.length} sentences)`);
      logConversationLatency(enriched.sentences);
      return;
    } catch (err) {
      console.warn(`[post-call:intelligence] Attempt ${attempt + 1} failed:`, err);
    }
  }

  console.warn(`[post-call:intelligence] Gave up fetching transcript for call ${callId} after ${MAX_ATTEMPTS} attempts`);
}

/**
 * Log per-turn conversational latency from enriched transcript.
 * Measures the gap between customer finishing and agent starting (full roundtrip:
 * STT recognition + API response + TTS start).
 */
function logConversationLatency(sentences: Array<{ speaker: string; startTime: number; endTime: number; text: string }>) {
  const latencies: number[] = [];

  for (let i = 1; i < sentences.length; i++) {
    const prev = sentences[i - 1]!;
    const curr = sentences[i]!;

    // Customer → Agent transition = response latency
    if (prev.speaker === "customer" && curr.speaker === "agent") {
      const gap = Math.round((curr.startTime - prev.endTime) * 1000);
      latencies.push(gap);
      console.log(`[latency] Customer→Agent: ${gap}ms ("${prev.text.substring(0, 30)}" → "${curr.text.substring(0, 30)}")`);
    }
    // Agent → Customer transition = customer response time (informational)
    if (prev.speaker === "agent" && curr.speaker === "customer") {
      const gap = Math.round((curr.startTime - prev.endTime) * 1000);
      console.log(`[latency] Agent→Customer: ${gap}ms`);
    }
  }

  if (latencies.length > 0) {
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    console.log(`[latency] Agent response: avg=${avg}ms min=${min}ms max=${max}ms (${latencies.length} turns)`);
  }
}

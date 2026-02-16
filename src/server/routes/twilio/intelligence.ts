import { Hono } from "hono";
import { db, schema } from "../../lib/db.ts";
import { eq } from "drizzle-orm";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";
import { fetchEnrichedTranscript } from "../../lib/intelligence.ts";

type TwilioVars = { Variables: { twilioBody: Record<string, string> } };
export const twilioIntelligenceRoutes = new Hono<TwilioVars>();

twilioIntelligenceRoutes.use("/*", twilioSignatureMiddleware);

// Twilio Intelligence webhook — fires when transcript processing completes
twilioIntelligenceRoutes.post("/", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const transcriptSid = body.TranscriptSid;
  const callSid = body.CallSid;

  console.log(`[twilio:intelligence] Webhook received: transcript=${transcriptSid} call=${callSid}`);

  if (!transcriptSid) {
    console.warn("[twilio:intelligence] No TranscriptSid in webhook body");
    return c.json({ ok: true });
  }

  if (!callSid) {
    console.warn("[twilio:intelligence] Missing CallSid in webhook body");
    return c.json({ ok: true });
  }

  // Find the call by Twilio callSid
  const [call] = await db
    .select({ id: schema.calls.id })
    .from(schema.calls)
    .where(eq(schema.calls.callSid, callSid));

  if (!call) {
    console.warn(`[twilio:intelligence] No call found for callSid=${callSid}`);
    return c.json({ ok: true });
  }

  // Fetch enriched transcript from Twilio Intelligence API
  try {
    const enriched = await fetchEnrichedTranscript(transcriptSid);

    await db
      .update(schema.calls)
      .set({
        enrichedTranscript: enriched,
        transcriptSid: transcriptSid,
      })
      .where(eq(schema.calls.id, call.id));

    console.log(
      `[twilio:intelligence] Enriched transcript saved for call ${call.id} (${enriched.sentences.length} sentences)`,
    );
  } catch (err) {
    console.error(`[twilio:intelligence] Failed to fetch enriched transcript:`, err);
  }

  return c.json({ ok: true });
});

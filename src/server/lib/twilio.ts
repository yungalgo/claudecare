import Twilio from "twilio";
import { env } from "../env.ts";
import { db, schema } from "./db.ts";
import { eq } from "drizzle-orm";

function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    console.warn("[twilio] No credentials configured — calls will be mocked");
    return null;
  }
  return Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

const client = getTwilioClient();

export async function initiateCall(callId: string, personId: string, phone: string) {
  if (!client) {
    console.log(`[twilio:mock] Would call ${phone} for person ${personId}`);
    return;
  }

  const voiceUrl = `${env.BASE_URL}/api/twilio/voice/answer?personId=${personId}&callSid=${callId}`;
  const statusUrl = `${env.BASE_URL}/api/twilio/status`;
  const recordingUrl = `${env.BASE_URL}/api/twilio/recording`;

  try {
    const twilioCall = await client.calls.create({
      to: phone,
      from: env.TWILIO_PHONE_NUMBER,
      url: voiceUrl,
      statusCallback: statusUrl,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: true,
      recordingStatusCallback: recordingUrl,
    });

    // Update call record with Twilio SID
    await db
      .update(schema.calls)
      .set({ callSid: twilioCall.sid, status: "in-progress" })
      .where(eq(schema.calls.id, callId));

    console.log(`[twilio] Call initiated: ${twilioCall.sid} → ${phone}`);
  } catch (err) {
    console.error(`[twilio] Call failed:`, err);
    await db
      .update(schema.calls)
      .set({ status: "failed", errorMessage: err instanceof Error ? err.message : "Unknown error" })
      .where(eq(schema.calls.id, callId));
  }
}

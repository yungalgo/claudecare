import Twilio from "twilio";
import type { Context, Next } from "hono";
import { env } from "../env.ts";
import { db, schema } from "./db.ts";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// --- WebSocket Token System ---

interface WsTokenData {
  personId: string;
  callId: string;
  createdAt: number;
}

const wsTokens = new Map<string, WsTokenData>();
const WS_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generateWsToken(personId: string, callId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  wsTokens.set(token, { personId, callId, createdAt: Date.now() });
  return token;
}

export function consumeWsToken(token: string): { personId: string; callId: string } | null {
  const data = wsTokens.get(token);
  if (!data) return null;
  wsTokens.delete(token);
  if (Date.now() - data.createdAt > WS_TOKEN_TTL_MS) return null;
  return { personId: data.personId, callId: data.callId };
}

// Clean up expired tokens every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of wsTokens) {
    if (now - data.createdAt > WS_TOKEN_TTL_MS) {
      wsTokens.delete(token);
    }
  }
}, 5 * 60 * 1000).unref();

// --- Twilio Signature Validation Middleware ---

/**
 * Twilio signature validation middleware.
 * Uses the full URL (including query string) because Twilio computes
 * the signature over the full webhook URL for POST requests.
 */
export async function twilioSignatureMiddleware(c: Context, next: Next) {
  const signature = c.req.header("x-twilio-signature") ?? "";
  // Reconstruct the URL as Twilio sees it: BASE_URL + path + query string
  const reqUrl = new URL(c.req.url);
  const fullUrl = `${env.BASE_URL}${reqUrl.pathname}${reqUrl.search}`;
  const body = await c.req.parseBody();
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "string") params[k] = v;
  }
  const valid = Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, fullUrl, params);
  if (!valid) {
    console.warn(`[twilio] Invalid signature for ${fullUrl}`);
    return c.json({ error: "Invalid Twilio signature" }, 403);
  }
  // Store parsed body so handlers don't re-parse
  c.set("twilioBody", body);
  return next();
}

// --- Initiate Call ---

export async function initiateCall(callId: string, personId: string, phone: string) {
  const wsToken = generateWsToken(personId, callId);
  const voiceUrl = `${env.BASE_URL}/api/twilio/voice/answer?personId=${personId}&callSid=${callId}&wsToken=${wsToken}`;
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

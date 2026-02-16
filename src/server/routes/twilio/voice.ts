import { Hono } from "hono";
import { env } from "../../env.ts";
import { db, schema } from "../../lib/db.ts";
import { eq, and, or, isNull, lt, sql } from "drizzle-orm";
import { twilioSignatureMiddleware, generateWsToken } from "../../lib/twilio.ts";
import { CALL_TYPES, getScheduleInterval, determineCallType } from "../../lib/constants.ts";
import voiceCatalog from "../../lib/twilio-voices.json";

type TwilioVars = { Variables: { twilioBody: Record<string, string> } };
export const twilioVoiceRoutes = new Hono<TwilioVars>();

twilioVoiceRoutes.use("/*", twilioSignatureMiddleware);

// --- Voice selection ---

interface VoiceEntry {
  name: string;
  voiceId: string;
  description: string;
  tags: string[];
  accent: string;
  age: string;
  languageCode: string;
  gender: string;
  category: string;
}

// Filter to English, female, middle-aged/old voices — best for elderly care calls
const ELIGIBLE_VOICES = (voiceCatalog as VoiceEntry[]).filter(
  (v) =>
    v.languageCode === "en" &&
    v.gender === "female" &&
    (v.age === "middle_aged" || v.age === "middle-aged" || v.age === "old") &&
    v.accent === "american",
);

function pickVoice(): { name: string; config: string } {
  const voice = ELIGIBLE_VOICES[Math.floor(Math.random() * ELIGIBLE_VOICES.length)];
  return { name: voice!.name, config: voice!.voiceId };
}

/** Generate ConversationRelay TwiML for a live call */
function conversationRelayTwiml(wsToken: string, voiceConfig: string): string {
  const wsUrl = `${env.BASE_URL.replace("http", "ws")}/ws/conversation-relay?wsToken=${wsToken}`;
  const intelligenceAttr = env.TWILIO_INTELLIGENCE_SERVICE_SID
    ? ` intelligenceService="${env.TWILIO_INTELLIGENCE_SERVICE_SID}"`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <ConversationRelay url="${wsUrl}" ttsProvider="ElevenLabs" voice="${voiceConfig}" dtmfDetection="true" interruptible="speech"${intelligenceAttr} />
  </Connect>
</Response>`;
}

// --- Outbound call answer (existing) ---
// Twilio calls this when an outbound call connects. Includes AMD detection.
twilioVoiceRoutes.post("/answer", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const answeredBy = body?.AnsweredBy ?? "human";
  const wsToken = c.req.query("wsToken") ?? "";
  const personId = c.req.query("personId") ?? "";
  const voice = pickVoice();

  // Voicemail detected — leave a message instead of connecting ConversationRelay
  if (answeredBy.startsWith("machine")) {
    // Look up person name and agent name for the voicemail
    let personName = "there";
    let agentName = "Sarah";
    if (personId) {
      const [person] = await db
        .select({ name: schema.persons.name, agentName: schema.persons.agentName })
        .from(schema.persons)
        .where(eq(schema.persons.id, personId));
      if (person) {
        personName = person.name;
        agentName = person.agentName ?? "Sarah";
      }
    }

    const callbackNumber = env.TWILIO_PHONE_NUMBER.replace(/(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi ${personName}, this is ${agentName} from ClaudeCare. We tried to reach you for your wellness check-in. Please call us back at your convenience at ${callbackNumber}. We look forward to talking with you soon. Have a great day!</Say>
  <Hangup/>
</Response>`;

    console.log(`[voice] Voicemail detected for ${personName}, leaving message`);
    return c.text(twiml, 200, { "Content-Type": "application/xml" });
  }

  // Human answered — proceed with ConversationRelay
  console.log(`[voice] Human answered, using: ${voice.name} (${voice.config})`);
  return c.text(conversationRelayTwiml(wsToken, voice.config), 200, { "Content-Type": "application/xml" });
  } catch (err) {
    console.error("[voice] Error in /answer handler:", err);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, a system error occurred. Please try again later.</Say><Hangup/></Response>`;
    return c.text(fallback, 200, { "Content-Type": "application/xml" });
  }
});

// --- Inbound call handler ---
// Set this as the "A call comes in" webhook URL in Twilio console:
// https://claudecare.com/api/twilio/voice/inbound
twilioVoiceRoutes.post("/inbound", async (c) => {
  const body = c.get("twilioBody") as Record<string, string>;
  const callerPhone = body?.From ?? "";
  const voice = pickVoice();

  // Look up person by phone number (match last 10 digits)
  const last10 = callerPhone.replace(/\D/g, "").slice(-10);
  const [person] = await db
    .select()
    .from(schema.persons)
    .where(
      and(
        sql`RIGHT(REPLACE(${schema.persons.phone}, '-', ''), 10) = ${last10}`,
        eq(schema.persons.status, "active"),
      ),
    )
    .limit(1);

  if (!person) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling ClaudeCare. This number is for enrolled members only. If you believe this is an error, please contact your care coordinator. Goodbye.</Say>
  <Hangup/>
</Response>`;
    console.log(`[voice:inbound] Unknown caller: ${callerPhone}`);
    return c.text(twiml, 200, { "Content-Type": "application/xml" });
  }

  // Determine if person is due for a wellness check based on their schedule
  const intervalDays = getScheduleInterval(person.callSchedule);
  const dueThreshold = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000);
  const isDue = !person.lastCallAt || person.lastCallAt < dueThreshold;

  const callType = isDue ? determineCallType(person.callCount ?? 0) : CALL_TYPES.CHECK_IN;
  const agentName = person.agentName ?? "Sarah";

  // Create call record
  const [call] = await db
    .insert(schema.calls)
    .values({
      personId: person.id,
      callType,
      callSource: "inbound",
      status: "in-progress",
      startedAt: new Date(),
    })
    .returning();

  // Generate WS token and return ConversationRelay TwiML
  const wsToken = generateWsToken(person.id, call!.id);

  console.log(`[voice:inbound] ${person.name} calling in → ${callType} call (agent: ${agentName})`);
  return c.text(conversationRelayTwiml(wsToken, voice.config), 200, { "Content-Type": "application/xml" });
});


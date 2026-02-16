import { Hono } from "hono";
import { env } from "../../env.ts";
import { twilioSignatureMiddleware } from "../../lib/twilio.ts";
import voiceCatalog from "../../lib/twilio-voices.json";

export const twilioVoiceRoutes = new Hono();

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
  // Use bare voice ID for now. To add tuning later:
  // `${voice.voiceId}-speed_stability_similarity` (e.g. `${voice.voiceId}-1.0_0.7_0.8`)
  return { name: voice!.name, config: voice!.voiceId };
}

// TwiML endpoint — Twilio calls this when a call connects
twilioVoiceRoutes.post("/answer", async (c) => {
  const wsToken = c.req.query("wsToken") ?? "";
  const wsUrl = `${env.BASE_URL.replace("http", "ws")}/ws/conversation-relay?wsToken=${wsToken}`;
  const voice = pickVoice();

  // <Pause> lets the call fully establish before bridging to ConversationRelay.
  // interruptible="speech" — only real speech interrupts TTS, not echo/noise.
  const intelligenceAttr = env.TWILIO_INTELLIGENCE_SERVICE_SID
    ? ` intelligenceService="${env.TWILIO_INTELLIGENCE_SERVICE_SID}"`
    : "";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <ConversationRelay url="${wsUrl}" ttsProvider="ElevenLabs" voice="${voice.config}" dtmfDetection="true" interruptible="speech"${intelligenceAttr} />
  </Connect>
</Response>`;

  console.log(`[voice] Using: ${voice.name} (${voice.config})`);
  return c.text(twiml, 200, { "Content-Type": "application/xml" });
});

// Expose for future API use
export { ELIGIBLE_VOICES, voiceCatalog };

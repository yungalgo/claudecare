import Twilio from "twilio";
import { env } from "../env.ts";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// --- Types ---

export interface EnrichedWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface EnrichedSentence {
  speaker: "agent" | "customer";
  text: string;
  startTime: number;
  endTime: number;
  words: EnrichedWord[];
}

export interface OperatorResult {
  operatorType: string;
  name: string;
  extractedData: unknown;
}

export interface EnrichedTranscript {
  transcriptSid: string;
  sentences: EnrichedSentence[];
  operators: OperatorResult[];
  fetchedAt: string;
}

// --- Fetcher ---

export async function fetchEnrichedTranscript(transcriptSid: string): Promise<EnrichedTranscript> {
  const rawSentences = await client.intelligence.v2
    .transcripts(transcriptSid)
    .sentences.list({ wordTimestamps: true, pageSize: 5000 });

  if (rawSentences.length === 0) {
    throw new Error(`No sentences returned for transcript ${transcriptSid}`);
  }

  // Recording transcript: ch2 = agent (TTS/bot output), ch1 = customer (patient voice)
  const sentences: EnrichedSentence[] = rawSentences.map((s: any, i: number) => {
    if (s.startTime == null || s.endTime == null) {
      throw new Error(`Missing timestamps on sentence ${i} of transcript ${transcriptSid}`);
    }
    if (!s.words || s.words.length === 0) {
      throw new Error(`Missing word timestamps on sentence ${i} of transcript ${transcriptSid} (requested wordTimestamps=true)`);
    }
    return {
      speaker: s.mediaChannel === 2 ? "agent" : "customer",
      text: s.transcript,
      startTime: parseFloat(s.startTime),
      endTime: parseFloat(s.endTime),
      words: s.words.map((w: any, wi: number) => {
        if (w.start_time == null || w.end_time == null) {
          throw new Error(`Missing timestamps on word ${wi} of sentence ${i} in transcript ${transcriptSid}`);
        }
        return {
          word: w.word,
          startTime: parseFloat(w.start_time),
          endTime: parseFloat(w.end_time),
        };
      }),
    };
  });

  // Fetch operator results (sentiment, topics, etc.)
  let operators: OperatorResult[] = [];
  try {
    const rawOperators = await client.intelligence.v2
      .transcripts(transcriptSid)
      .operatorResults.list({ limit: 50 });

    operators = rawOperators.map((o: any) => ({
      operatorType: o.operatorType,
      name: o.name ?? o.operatorType,
      extractedData: o.extractedData,
    }));
  } catch (err: any) {
    // 404 = no operators configured (expected). Anything else is a real error.
    if (err.status === 404 || err.code === 20404) {
      console.log(`[intelligence] No operators configured for transcript ${transcriptSid}`);
    } else {
      throw err;
    }
  }

  return {
    transcriptSid,
    sentences,
    operators,
    fetchedAt: new Date().toISOString(),
  };
}

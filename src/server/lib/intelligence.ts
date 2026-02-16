import Twilio from "twilio";
import { env } from "../env.ts";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// --- Types ---

export interface EnrichedWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface EnrichedSentence {
  speaker: "agent" | "customer";
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
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
  // Fetch sentences with word-level timestamps (paginate through all)
  const rawSentences = await client.intelligence.v2
    .transcripts(transcriptSid)
    .sentences.list({ wordTimestamps: true, pageSize: 5000 });

  // Recording transcript: ch1 = agent (Twilio number), ch2 = customer
  const sentences: EnrichedSentence[] = rawSentences.map((s: any) => ({
    speaker: s.mediaChannel === 2 ? "agent" : "customer",
    text: s.transcript,
    startTime: parseFloat(s.startTime),
    endTime: parseFloat(s.endTime),
    confidence: parseFloat(s.confidence ?? "1"),
    words: (s.words ?? []).map((w: any) => ({
      word: w.word,
      startTime: parseFloat(w.start_time ?? "0"),
      endTime: parseFloat(w.end_time ?? "0"),
      confidence: parseFloat(w.confidence ?? "1"),
    })),
  }));

  // Fetch operator results (sentiment, topics, etc.) — best-effort
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
  } catch {
    // Operators may not be configured — not an error
  }

  return {
    transcriptSid,
    sentences,
    operators,
    fetchedAt: new Date().toISOString(),
  };
}

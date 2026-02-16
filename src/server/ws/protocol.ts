import { anthropic, CALL_SYSTEM_PROMPT, ASSESSMENT_TOOL } from "../lib/claude.ts";
import { db, schema } from "../lib/db.ts";
import { eq, and, sql } from "drizzle-orm";

// Haiku for real-time conversation (low latency matters most)
// Sonnet for final assessment (accuracy matters, not latency)
const CONVERSATION_MODEL = "claude-haiku-4-5-20251001";
const ASSESSMENT_MODEL = "claude-sonnet-4-5-20250929";

interface ConversationState {
  personId: string;
  callId: string;
  personName: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const sessions = new Map<string, ConversationState>();

export function createSession(callSid: string, personId: string, callId: string, personName: string) {
  const state: ConversationState = {
    personId,
    callId,
    personName,
    messages: [],
  };
  sessions.set(callSid, state);
  return state;
}

export function getSession(callSid: string) {
  return sessions.get(callSid);
}

export function deleteSession(callSid: string) {
  return sessions.delete(callSid);
}

/**
 * Update lastCallAt on WS close (even for incomplete calls).
 * Transcript is provided by Twilio Intelligence via webhook.
 */
export async function saveTranscript(callSid: string) {
  const state = sessions.get(callSid);
  if (!state) return;

  await db
    .update(schema.persons)
    .set({ lastCallAt: new Date() })
    .where(eq(schema.persons.id, state.personId));

  console.log(`[protocol] Call closed for ${state.callId}`);
}

// Get the opening message from Claude
export async function getGreeting(state: ConversationState): Promise<string> {
  const response = await anthropic.messages.create({
    model: CONVERSATION_MODEL,
    max_tokens: 200,
    system: CALL_SYSTEM_PROMPT + `\n\nYou are calling ${state.personName}. This is the START of the call. Deliver your opening greeting. Keep it brief — 1-2 sentences max.`,
    messages: [{ role: "user", content: "[Call connected. Deliver your opening greeting.]" }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "Hello, how are you?";
  state.messages.push({ role: "assistant", content: text });
  return text;
}

// Process a speech input from the caller and get Claude's response
// Returns { text, endCall } — endCall is true after assessment submission (call is done)
export async function processUtterance(state: ConversationState, utterance: string): Promise<{ text: string; endCall: boolean }> {
  state.messages.push({ role: "user", content: utterance });

  const response = await anthropic.messages.create({
    model: CONVERSATION_MODEL,
    max_tokens: 300,
    system: CALL_SYSTEM_PROMPT + `\n\nYou are calling ${state.personName}. Continue the conversation naturally following the protocol phases. Keep responses concise — this is a phone call, not a letter. 2-3 sentences max per turn.`,
    messages: state.messages,
    tools: [ASSESSMENT_TOOL],
  });

  let text = "";
  let endCall = false;
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use" && block.name === "submit_assessment") {
      await handleAssessmentSubmission(state, block.input as Record<string, unknown>);
      endCall = true;
    }
  }

  if (text) {
    state.messages.push({ role: "assistant", content: text });
  }

  return { text, endCall };
}

/**
 * Save assessment and transcript. Flag computation and escalation creation
 * are handled by the post-call job (triggered by Twilio status webhook).
 */
async function handleAssessmentSubmission(state: ConversationState, input: Record<string, unknown>) {
  console.log(`[protocol] Assessment submitted for ${state.personName}:`, input);

  // Insert assessment (flag will be recomputed by post-call job)
  await db.insert(schema.assessments).values({
    callId: state.callId,
    personId: state.personId,
    meals: input.meals as number,
    sleep: input.sleep as number,
    health: input.health as number,
    social: input.social as number,
    mobility: input.mobility as number,
    phq2Score: input.phq2_score as number,
    phq2TriggeredCssrs: input.phq2_triggered_cssrs as boolean,
    cssrsResult: input.cssrs_result as string | undefined,
    ottawaScore: input.ottawa_score as number,
    flag: input.flag as string,
  });

  // Update call with summary
  await db
    .update(schema.calls)
    .set({ summary: input.summary as string })
    .where(eq(schema.calls.id, state.callId));

  // Update person lastCallAt and callCount (completed calls only)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.personId, state.personId),
        eq(schema.calls.status, "completed"),
      ),
    );

  await db
    .update(schema.persons)
    .set({
      lastCallAt: new Date(),
      callCount: (countResult?.count ?? 0) + 1,
    })
    .where(eq(schema.persons.id, state.personId));
}

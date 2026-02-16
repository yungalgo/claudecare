import { anthropic, CALL_SYSTEM_PROMPT, ASSESSMENT_TOOL } from "../lib/claude.ts";
import { db, schema } from "../lib/db.ts";
import { eq, and, sql } from "drizzle-orm";

interface ConversationState {
  personId: string;
  callId: string;
  personName: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  transcript: string[];
}

const sessions = new Map<string, ConversationState>();

export function createSession(callSid: string, personId: string, callId: string, personName: string) {
  const state: ConversationState = {
    personId,
    callId,
    personName,
    messages: [],
    transcript: [],
  };
  sessions.set(callSid, state);
  return state;
}

export function getSession(callSid: string) {
  return sessions.get(callSid);
}

export function deleteSession(callSid: string) {
  sessions.delete(callSid);
}

// Get the opening message from Claude
export async function getGreeting(state: ConversationState): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 300,
    system: CALL_SYSTEM_PROMPT + `\n\nYou are calling ${state.personName}. This is the START of the call. Deliver your opening greeting.`,
    messages: [{ role: "user", content: "[Call connected. Deliver your opening greeting.]" }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "Hello, how are you?";
  state.messages.push({ role: "assistant", content: text });
  state.transcript.push(`claudecare: ${text}`);
  return text;
}

// Process a speech input from the caller and get Claude's response
export async function processUtterance(state: ConversationState, utterance: string): Promise<string> {
  state.messages.push({ role: "user", content: utterance });
  state.transcript.push(`${state.personName}: ${utterance}`);

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500,
    system: CALL_SYSTEM_PROMPT + `\n\nYou are calling ${state.personName}. Continue the conversation naturally following the protocol phases.`,
    messages: state.messages,
    tools: [ASSESSMENT_TOOL],
  });

  let text = "";
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use" && block.name === "submit_assessment") {
      await handleAssessmentSubmission(state, block.input as Record<string, unknown>);
    }
  }

  if (text) {
    state.messages.push({ role: "assistant", content: text });
    state.transcript.push(`claudecare: ${text}`);
  }

  return text;
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

  // Update call with summary and transcript
  await db
    .update(schema.calls)
    .set({
      summary: input.summary as string,
      transcript: state.transcript.join("\n"),
    })
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
      callCount: (countResult?.count ?? 0) + 1, // +1 for current call not yet marked completed
    })
    .where(eq(schema.persons.id, state.personId));
}

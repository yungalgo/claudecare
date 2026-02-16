import { anthropic, CALL_SYSTEM_PROMPT, COMPREHENSIVE_PROTOCOL_EXTENSION, ASSESSMENT_TOOL, COMPREHENSIVE_ASSESSMENT_TOOL, CHECK_IN_SYSTEM_PROMPT, CHECK_IN_TOOL } from "../lib/claude.ts";
import { db, schema } from "../lib/db.ts";
import { eq, and, sql, desc } from "drizzle-orm";
import { CALL_TYPES, type CallType } from "../lib/constants.ts";

// Haiku 4.5 for real-time conversation (low latency)
// Opus 4.6 for everything else (accuracy)
const CONVERSATION_MODEL = "claude-haiku-4-5-20251001";
const ASSESSMENT_MODEL = "claude-opus-4-6";

// Phases match the system prompt structure
type CallPhase = "opening" | "clova5" | "phq2" | "cssrs" | "needs" | "ottawa" | "comprehensive" | "closing" | "assessment";

interface ConversationState {
  personId: string;
  callId: string;
  personName: string;
  agentName: string;
  callType: CallType;
  currentPhase: CallPhase;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  memoryContext: string;
}

const sessions = new Map<string, ConversationState>();

export function createSession(
  callSid: string,
  personId: string,
  callId: string,
  personName: string,
  agentName: string,
  callType: CallType,
  memoryContext: string,
) {
  const state: ConversationState = {
    personId,
    callId,
    personName,
    agentName,
    callType,
    currentPhase: "opening",
    messages: [],
    memoryContext,
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

  console.log(`[protocol] Call closed for ${state.callId} (phase: ${state.currentPhase})`);
}

/**
 * Fetch cross-call memory for a person: last call summary + person notes.
 * Returns a string to append to the system prompt, or empty string if no history.
 */
export async function fetchMemoryContext(personId: string): Promise<string> {
  const parts: string[] = [];

  // Get person notes
  const [person] = await db
    .select({ notes: schema.persons.notes })
    .from(schema.persons)
    .where(eq(schema.persons.id, personId));

  if (person?.notes) {
    parts.push(`Care coordinator notes: ${person.notes}`);
  }

  // Get last completed call summary
  const [lastCall] = await db
    .select({ summary: schema.calls.summary, completedAt: schema.calls.completedAt })
    .from(schema.calls)
    .where(
      and(
        eq(schema.calls.personId, personId),
        eq(schema.calls.status, "completed"),
      ),
    )
    .orderBy(desc(schema.calls.completedAt))
    .limit(1);

  if (lastCall?.summary) {
    const daysAgo = lastCall.completedAt
      ? Math.round((Date.now() - lastCall.completedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const timeRef = daysAgo !== null ? `${daysAgo} days ago` : "previously";
    parts.push(`Last call (${timeRef}): ${lastCall.summary}`);
  }

  // Get last assessment scores for trend context
  const [lastAssessment] = await db
    .select({
      meals: schema.assessments.meals,
      sleep: schema.assessments.sleep,
      health: schema.assessments.health,
      social: schema.assessments.social,
      mobility: schema.assessments.mobility,
      phq2Score: schema.assessments.phq2Score,
      ottawaScore: schema.assessments.ottawaScore,
      flag: schema.assessments.flag,
    })
    .from(schema.assessments)
    .where(eq(schema.assessments.personId, personId))
    .orderBy(desc(schema.assessments.createdAt))
    .limit(1);

  if (lastAssessment) {
    const scores = [
      `CLOVA-5: meals=${lastAssessment.meals}, sleep=${lastAssessment.sleep}, health=${lastAssessment.health}, social=${lastAssessment.social}, mobility=${lastAssessment.mobility}`,
      `PHQ-2: ${lastAssessment.phq2Score ?? "n/a"}`,
      `Ottawa: ${lastAssessment.ottawaScore ?? "n/a"}/4`,
      `Flag: ${lastAssessment.flag}`,
    ].join("; ");
    parts.push(`Previous scores: ${scores}`);
  }

  return parts.length > 0 ? parts.join("\n") : "";
}

/** Build the full system prompt for a given conversation state. */
function buildSystemPrompt(state: ConversationState, preamble: string): string {
  // Check-in calls use a completely different prompt
  if (state.callType === CALL_TYPES.CHECK_IN) {
    let prompt = CHECK_IN_SYSTEM_PROMPT
      .replace("{AGENT_NAME}", state.agentName)
      .replace("{PERSON_NAME}", state.personName);
    if (state.memoryContext) {
      prompt += `\n\n## CONTEXT\n${state.memoryContext}`;
    }
    prompt += `\n\n${preamble}`;
    return prompt;
  }

  let prompt = CALL_SYSTEM_PROMPT.replace("{AGENT_NAME}", state.agentName);

  if (state.callType === CALL_TYPES.COMPREHENSIVE) {
    prompt += COMPREHENSIVE_PROTOCOL_EXTENSION;
  }

  if (state.memoryContext) {
    prompt += `\n\n## PREVIOUS CALL CONTEXT\n${state.memoryContext}`;
  }

  prompt += `\n\n## CURRENT STATE\nYou are calling ${state.personName}. Call type: ${state.callType}. Current phase: ${state.currentPhase}. ${preamble}`;

  return prompt;
}

// Get the opening message from Claude
export async function getGreeting(state: ConversationState): Promise<string> {
  const response = await anthropic.messages.create({
    model: CONVERSATION_MODEL,
    max_tokens: 200,
    system: buildSystemPrompt(state, "This is the START of the call. Deliver your opening greeting. Keep it brief — 1-2 sentences max."),
    messages: [{ role: "user", content: "[Call connected. Deliver your opening greeting.]" }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") throw new Error("Greeting response missing text content");
  const text = block.text;
  state.messages.push({ role: "assistant", content: text });
  return text;
}

// Process a speech input from the caller and get Claude's response
// Returns { text, endCall } — endCall is true after assessment submission (call is done)
export async function processUtterance(state: ConversationState, utterance: string): Promise<{ text: string; endCall: boolean }> {
  state.messages.push({ role: "user", content: utterance });

  const isCheckIn = state.callType === CALL_TYPES.CHECK_IN;
  const tool = isCheckIn ? CHECK_IN_TOOL : state.callType === CALL_TYPES.COMPREHENSIVE ? COMPREHENSIVE_ASSESSMENT_TOOL : ASSESSMENT_TOOL;
  const preamble = isCheckIn
    ? "Continue the friendly conversation. Keep responses concise — 2-3 sentences max per turn."
    : "Continue the conversation naturally following the protocol phases. Keep responses concise — this is a phone call, not a letter. 2-3 sentences max per turn.";

  const response = await anthropic.messages.create({
    model: CONVERSATION_MODEL,
    max_tokens: 300,
    system: buildSystemPrompt(state, preamble),
    messages: state.messages,
    tools: [tool],
  });

  let text = "";
  let endCall = false;
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use" && block.name === "submit_assessment") {
      // Haiku detected the conversation is complete — use Opus for the final assessment
      // tool is guaranteed to be ASSESSMENT_TOOL or COMPREHENSIVE_ASSESSMENT_TOOL here
      // (CHECK_IN_TOOL uses submit_checkin_summary, not submit_assessment)
      state.currentPhase = "assessment";
      const assessmentTool = tool as typeof ASSESSMENT_TOOL | typeof COMPREHENSIVE_ASSESSMENT_TOOL;
      const assessmentInput = await getAccurateAssessment(state, assessmentTool);
      await handleAssessmentSubmission(state, assessmentInput);
      endCall = true;
    } else if (block.type === "tool_use" && block.name === "submit_checkin_summary") {
      // Check-in call ending — save summary only (no clinical scores)
      state.currentPhase = "closing";
      await handleCheckInSubmission(state, block.input as Record<string, unknown>);
      endCall = true;
    }
  }

  if (text) {
    state.messages.push({ role: "assistant", content: text });
    // Update phase based on conversation progress
    updatePhase(state, text);
  }

  return { text, endCall };
}

/**
 * Re-send the full conversation to Opus for a more accurate assessment.
 */
async function getAccurateAssessment(
  state: ConversationState,
  tool: typeof ASSESSMENT_TOOL | typeof COMPREHENSIVE_ASSESSMENT_TOOL,
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: ASSESSMENT_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(state, "The conversation is complete. Review the ENTIRE conversation and submit accurate assessment scores via the submit_assessment tool. Be precise with scoring based on the actual responses given."),
    messages: state.messages,
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_assessment" },
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "submit_assessment") {
      console.log(`[protocol] Opus assessment for ${state.personName}`);
      return block.input as Record<string, unknown>;
    }
  }

  throw new Error("Opus did not return assessment tool_use");
}

/** Infer current phase from Claude's response text. */
function updatePhase(state: ConversationState, text: string) {
  const lower = text.toLowerCase();

  // Phase detection heuristics based on protocol structure
  if (state.currentPhase === "opening" && (lower.includes("eating") || lower.includes("meal") || lower.includes("breakfast") || lower.includes("lunch") || lower.includes("dinner"))) {
    state.currentPhase = "clova5";
  } else if (state.currentPhase === "clova5" && (lower.includes("little interest") || lower.includes("pleasure in doing") || lower.includes("two quick questions"))) {
    state.currentPhase = "phq2";
  } else if (state.currentPhase === "phq2" && (lower.includes("wished you were dead") || lower.includes("go to sleep and not wake"))) {
    state.currentPhase = "cssrs";
  } else if ((state.currentPhase === "phq2" || state.currentPhase === "cssrs") && (lower.includes("enough food") || lower.includes("supplies") || lower.includes("medications"))) {
    state.currentPhase = "needs";
  } else if (state.currentPhase === "needs" && (lower.includes("day of the week") || lower.includes("today's date") || lower.includes("what year"))) {
    state.currentPhase = "ottawa";
  } else if (state.currentPhase === "ottawa" && state.callType === CALL_TYPES.COMPREHENSIVE && (lower.includes("orientation") || lower.includes("three words") || lower.includes("companionship") || lower.includes("daily activities"))) {
    state.currentPhase = "comprehensive";
  } else if ((state.currentPhase === "ottawa" || state.currentPhase === "comprehensive") && (lower.includes("anything else") || lower.includes("call again") || lower.includes("have a good"))) {
    state.currentPhase = "closing";
  }
}

/** Save check-in summary (no clinical scores). */
async function handleCheckInSubmission(state: ConversationState, input: Record<string, unknown>) {
  console.log(`[protocol] Check-in summary for ${state.personName}:`, input);

  await db
    .update(schema.calls)
    .set({ summary: input.summary as string })
    .where(eq(schema.calls.id, state.callId));

  await db
    .update(schema.persons)
    .set({ lastCallAt: new Date() })
    .where(eq(schema.persons.id, state.personId));

  // If concerns were noted, create a routine escalation
  if (input.concerns_noted) {
    const { createEscalation } = await import("../lib/escalation.ts");
    await createEscalation({
      personId: state.personId,
      callId: state.callId,
      tier: "routine",
      reason: "Concern noted during inbound check-in call",
      details: (input.concern_details as string) || (input.summary as string),
    });
  }
}

/**
 * Save assessment and transcript. Flag computation and escalation creation
 * are handled by the post-call job (triggered by Twilio status webhook).
 */
async function handleAssessmentSubmission(state: ConversationState, input: Record<string, unknown>) {
  console.log(`[protocol] Assessment submitted for ${state.personName}:`, input);

  // Insert assessment — flag will be recomputed by post-call scoring pipeline
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
    // Comprehensive-only instruments (null if not collected)
    teleFreeCogScore: (input.tele_free_cog_score as number) ?? null,
    steadiScore: (input.steadi_score as number) ?? null,
    uclaLonelinessScore: (input.ucla_loneliness_score as number) ?? null,
    lawtonIadlScore: (input.lawton_iadl_score as number) ?? null,
    flag: "green", // Placeholder — post-call job will recompute
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

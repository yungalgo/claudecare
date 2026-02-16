# ClaudeCare Business Logic

## What ClaudeCare Does

ClaudeCare is an AI-powered wellness monitoring platform that makes automated phone calls to isolated seniors, conducts validated clinical screenings through natural conversation, and alerts care coordinators when someone needs attention. It is designed for organizations that serve older adults: senior living facilities, home health agencies, Area Agencies on Aging, etc.

A single Bun process handles HTTP (Hono), WebSocket (Twilio ConversationRelay), and background jobs (pg-boss) — no separate workers. All data is multi-tenant, scoped by `userId`.

---

## 1. Users & Authentication

### Registration & Login
- Users sign up with email and password via better-auth (email+password provider).
- Sessions are cookie-based with a 5-minute server-side cache.
- Password reset sends a tokenized link via Resend email (expires in 1 hour).
- There is no invite system or approval flow — anyone can sign up. Users are isolated by multi-tenancy; they only ever see their own data.

### Multi-Tenancy Enforcement
- Every `person` record has a `userId` foreign key.
- Every API route for persons, calls, assessments, and escalations filters by `userId` from the session.
- Routes for `calls`, `assessments`, and `escalations` (which don't have a direct `userId` column) enforce ownership by JOINing through the `persons` table.
- The analytics route uses a subquery of the user's person IDs to scope all aggregate queries.
- Twilio webhook routes (`/api/twilio/*`) are exempt from session auth but validated via Twilio signature (`x-twilio-signature` header using `TWILIO_AUTH_TOKEN`).
- WebSocket connections are authenticated via single-use tokens (see Call Initiation below).
- The dev trigger endpoint (`/api/dev/trigger-call`) requires both localhost and a valid session with userId scoping.

---

## 2. Persons (Seniors / Clients)

### Data Model
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | text | Yes | Full name |
| phone | text | Yes | Phone number (E.164 format) |
| emergencyContactName | text | No | Emergency contact name |
| emergencyContactPhone | text | No | Emergency contact phone |
| pcpName | text | No | Primary care provider name |
| pcpPhone | text | No | PCP phone |
| notes | text | No | Free-text notes from care coordinator — injected into the AI agent's context on every call |
| status | text | Yes | `active`, `paused`, or `discharged` |
| flag | text | Yes | `green`, `yellow`, or `red` |
| lastCallAt | timestamp | Auto | Set after every call (even incomplete ones) |
| callCount | integer | Auto | Count of completed calls |

### Statuses
- **Active**: Person receives automated weekly calls. Only active persons are picked up by the scheduler.
- **Paused**: No automated calls. Can still be called manually. Useful for hospitalizations, vacations, etc.
- **Discharged**: No calls. Effectively archived. Still appears in searches with status filter set to "all."

### Adding Persons
- **Single**: POST `/api/persons` with name, phone, and optional fields. Validated with Zod.
- **Bulk CSV upload**: POST `/api/persons/upload` with an array of rows. Each row is validated individually. All rows are assigned to the current user.

### Flags
A person's flag is always the flag from their most recent assessment. It updates automatically after every completed call via the post-call scoring pipeline. There is no manual flag override — the flag is purely computed.

| Flag | Meaning |
|------|---------|
| **Green** | Stable. No concerns detected. Continue weekly calls. |
| **Yellow** | Monitor. One or more screening thresholds tripped. Care coordinator should review. |
| **Red** | Alert. Critical concern (suicidal ideation, possible dementia). Immediate or urgent follow-up required. |

---

## 3. Call Types

### Weekly Calls (Default)
- **Duration**: 5-8 minutes
- **Frequency**: Every 7+ days for active persons
- **Instruments**: CLOVA-5, PHQ-2, C-SSRS (conditional), Ottawa 3DY, plus a needs assessment
- **Trigger**: Automated via daily scheduler, or manual via dashboard "Call Now" button

### Quarterly Calls
- **Duration**: 12-15 minutes
- **Frequency**: Manually triggered (no automatic quarterly scheduling yet)
- **Instruments**: All weekly instruments PLUS Tele-Free-Cog, STEADI, UCLA-3, and Lawton IADL
- **Trigger**: Manual only — care coordinator clicks "Call Now" and selects "quarterly" call type
- The system prompt is extended with the `QUARTERLY_PROTOCOL_EXTENSION` that defines all four additional instruments with exact questions, scoring rubrics, and administration instructions.

---

## 4. Call Scheduling & Sequential Processing

### Daily Cron
- pg-boss schedules a `schedule-calls` cron job at `CALL_WINDOW_START` (default: 09:00 in `CALL_WINDOW_TZ`, default: America/New_York).
- The cron expression is derived from the config: `"09:00"` → `"0 9 * * *"`.

### Finding the Next Person Due
`scheduleNextCall()` runs this logic:
1. Check current time against `CALL_WINDOW_END` (default: 17:00). If past the window, stop.
2. Query for the next active person whose `lastCallAt` is either NULL (never called) or more than 7 days ago.
3. Order by `lastCallAt ASC` — persons never called come first, then the longest-waiting person.
4. No user scoping — the scheduler processes ALL users' persons (it's a system-level job).

### Sequential Chain
Calls are processed one at a time, not in parallel:
1. `schedule-calls` cron → `scheduleNextCall()` → creates call record → queues `process-call`
2. `process-call` → initiates Twilio call
3. Call completes → Twilio status webhook fires → runs `processPostCall()` inline
4. `post-call` scores the assessment → creates escalations → queues `process-next-call` with `CALL_GAP_SECONDS` delay (default: 10 seconds)
5. `process-next-call` → `scheduleNextCall()` again
6. This chain repeats until `CALL_WINDOW_END` is reached or no more persons are due.

### Manual Calls
- POST `/api/calls/trigger` with `{ personId, callType? }` (defaults to "weekly")
- Creates a call record and queues it via pg-boss `process-call`
- Bypasses the scheduler — can be done anytime, regardless of call window
- The dev endpoint (`/api/dev/trigger-call`) skips pg-boss and calls Twilio directly for faster testing

---

## 5. Call Initiation & WebSocket Authentication

### Token System
When a call is initiated (`initiateCall()`):
1. Generate a cryptographically random 32-byte hex token.
2. Store it in an in-memory `Map<string, { personId, callId, createdAt }>` with a 5-minute TTL.
3. Pass the token as a query parameter in the Twilio voice webhook URL: `/api/twilio/voice/answer?wsToken=...`
4. The TwiML response includes a `<ConversationRelay>` element pointing to `wss://claudecare.com/ws/conversation-relay?wsToken=...`
5. When Twilio opens the WebSocket, the server validates and **consumes** the token (single-use).
6. If the token is missing, expired, or already used, the WebSocket upgrade is rejected (401).
7. Expired tokens are cleaned up every 5 minutes via `setInterval`.

### Twilio Call Setup
```
Twilio API call → Person's phone rings → Person answers
→ Twilio hits POST /api/twilio/voice/answer
→ Returns TwiML: <Pause 1s/> then <ConversationRelay> with WebSocket URL
→ Twilio opens WebSocket to our server
→ Server validates wsToken on upgrade
→ WebSocket session begins
```

### Voice Selection
- Voices are filtered from a catalog: English, female, middle-aged or old, American accent.
- A random eligible ElevenLabs voice is selected for each call.
- TTS provider: ElevenLabs (via Twilio ConversationRelay `ttsProvider="ElevenLabs"`).
- DTMF detection is enabled. Interruptibility is set to "speech" (only real speech interrupts TTS, not echo/noise).

---

## 6. Real-Time Conversation Protocol

### WebSocket Message Types (Twilio ConversationRelay)

**From Twilio:**
- `setup` — Call connected. Contains `callSid`. Triggers session creation + greeting.
- `prompt` — Speech-to-text result. Contains `voicePrompt` (the caller's words).
- `interrupt` — Caller interrupted the TTS. Logged but not acted upon.
- `dtmf` — Keypad press. Logged but not acted upon.

**To Twilio:**
- `{ type: "text", token: "..." }` — Text to speak via TTS.
- `{ type: "end" }` — Hang up the call.

### Session Creation (on `setup` message)
When Twilio sends the `setup` message:
1. Look up the person's name from the database.
2. Look up the call's `callType` (weekly or quarterly) from the database.
3. Fetch **cross-call memory context** (see Section 8 below).
4. Create a `ConversationState` object with: personId, callId, personName, callType, currentPhase="opening", empty messages array, memoryContext.
5. Store the session in an in-memory `Map<callSid, ConversationState>`.
6. Update the call record with the Twilio `callSid` and `startedAt` timestamp.
7. Generate the opening greeting via Claude Haiku.
8. Send the greeting to Twilio for TTS.

All three lookups (person, call, memory context) run in parallel via `Promise.all` for minimal latency.

### Turn-by-Turn Processing (on `prompt` message)
When the caller speaks and Twilio sends the transcribed text:
1. Append the utterance to `state.messages` as `{ role: "user", content: utterance }`.
2. Build the system prompt (see Section 7).
3. Call Claude Haiku with the full message history, system prompt, and the assessment tool.
4. Process the response:
   - If it contains a `text` block: append to messages as assistant, send to Twilio for TTS.
   - If it contains a `tool_use` block for `submit_assessment`: trigger the assessment pipeline (see Section 10).
5. Update the current phase based on heuristic text analysis (see Phase Tracking below).
6. If the call is ending (`endCall = true`), wait 8 seconds for TTS to finish, then send `{ type: "end" }` to hang up.

### Error Handling
If any error occurs during message processing, the agent sends: "I'm sorry, I'm having a technical difficulty. Let me try again." This keeps the call alive rather than crashing it.

---

## 7. Agent Instructions (System Prompt)

### Prompt Structure
The system prompt is built dynamically on every API call to Claude. It consists of:

1. **Base prompt** (`CALL_SYSTEM_PROMPT`): ~95 lines defining persona, 6-phase protocol, screening questions with exact wording, scoring rubrics, conditional branching (PHQ-2 → C-SSRS), needs assessment questions, behavioral rules.

2. **Quarterly extension** (if `callType === "quarterly"`): Appends `QUARTERLY_PROTOCOL_EXTENSION` with detailed protocols for Tele-Free-Cog, STEADI, UCLA-3, and Lawton IADL.

3. **Cross-call memory** (if available): Appends a `## PREVIOUS CALL CONTEXT` section with notes, last call summary, and previous assessment scores.

4. **Current state**: Appends `## CURRENT STATE` with the person's name, call type, current phase, and a turn-specific preamble (e.g., "This is the START of the call" or "Continue the conversation naturally").

### Persona & Behavioral Rules
The agent is instructed to be:
- Warm, patient, empathetic
- Named "claudecare"
- Clear and moderate-paced, using simple language appropriate for elderly adults

Explicit rules:
1. Never diagnose or prescribe. Screening only.
2. If someone is in immediate danger, prioritize safety and escalate.
3. Be patient — allow extra time for responses.
4. Don't rush the protocol. Let it flow naturally.
5. If someone refuses a question, note it and move on gracefully.
6. Always maintain a warm, caring tone.

### Conciseness Constraints
- Greeting: "1-2 sentences max"
- Each turn: "2-3 sentences max per turn — this is a phone call, not a letter"
- These constraints are injected on every API call in the preamble.

---

## 8. Cross-Call Memory

Before each call, `fetchMemoryContext()` queries three things and injects them into the system prompt:

### 1. Care Coordinator Notes
The `notes` field from the person record. Set by the care coordinator in the dashboard. Example: "Lives alone. Has a cat named Whiskers. Daughter visits on Sundays." The agent uses these to personalize the conversation.

### 2. Last Call Summary
The `summary` field from the most recent completed call for this person. Includes how many days ago it was. Example: "Last call (7 days ago): Margaret reported sleeping poorly due to hip pain. Meals and social contact were good. PHQ-2 was 1. Ottawa 3DY was 4/4."

### 3. Previous Assessment Scores
The raw scores from the last assessment: CLOVA-5 metrics, PHQ-2 score, Ottawa score, and flag. Example: "Previous scores: CLOVA-5: meals=4, sleep=2, health=3, social=4, mobility=3; PHQ-2: 1; Ottawa: 4/4; Flag: yellow"

This gives the agent trend context. If sleep was 2 last week and the person mentions sleeping better, the agent can acknowledge the improvement. The system prompt's `## MEMORY` section instructs: "If you have information from previous calls, reference something specific."

---

## 9. Phase Tracking

### Phase Types
```
opening → clova5 → phq2 → cssrs → needs → ottawa → quarterly → closing → assessment
```

### How Phases Are Tracked
There is **no explicit state machine** that the agent follows mechanically. Instead:

1. The agent's **message history IS the state**. Claude reviews the full conversation on every turn and determines what to ask next based on the 6-phase protocol in its system prompt.

2. The server-side `currentPhase` field is tracked via **heuristic text analysis** of Claude's responses. When Claude starts asking about meals, the phase transitions to `clova5`. When it asks PHQ-2 questions, it moves to `phq2`, etc.

3. The `currentPhase` is included in the system prompt's `## CURRENT STATE` section, giving Claude a hint about where the conversation is.

### Phase Detection Heuristics
Transitions are detected by keyword matching on Claude's response text:
- `opening` → `clova5`: mentions eating, meals, breakfast, lunch, dinner
- `clova5` → `phq2`: mentions "little interest", "pleasure in doing", "two quick questions"
- `phq2` → `cssrs`: mentions "wished you were dead", "go to sleep and not wake"
- `phq2/cssrs` → `needs`: mentions "enough food", "supplies", "medications"
- `needs` → `ottawa`: mentions "day of the week", "today's date", "what year"
- `ottawa` → `quarterly`: (quarterly calls only) mentions "orientation", "three words", "companionship", "daily activities"
- `ottawa/quarterly` → `closing`: mentions "anything else", "call again", "have a good"

### Tone & Emotional Feedback
The system prompt instructs Claude to "Listen for speech coherence, response time, and emotional tone" during Phase 1. Claude processes the caller's transcribed speech and naturally adapts:
- If the caller sounds distressed, Claude responds with more empathy
- If the caller is chatty, Claude lets them talk but gently guides back to the protocol
- If the caller is monosyllabic, Claude asks more open-ended follow-ups
- If the caller doesn't want to answer a question, Claude notes it and moves on

This is not a separate "tone analysis" module — it's inherent in Claude's language understanding applied to the conversation history. The full transcript is sent on every turn, so Claude always has complete context of how the conversation has gone.

---

## 10. Assessment Submission & Dual-Model Architecture

### Two Models, Two Jobs
| Model | Purpose | When Used |
|-------|---------|-----------|
| Claude Haiku 4.5 | Real-time conversation | Every turn during the call (latency-critical) |
| Claude Opus 4.6 | Final assessment scoring | Once at end of call (accuracy-critical) |

### How Assessment Submission Works
1. The `submit_assessment` tool is provided to Haiku on every turn.
2. When Haiku determines the conversation is complete (all phases done), it signals by calling the tool.
3. The server intercepts this tool_use and does NOT use Haiku's scores. Instead:
4. The **full conversation history** is re-sent to **Opus 4.6** with `tool_choice: { type: "tool", name: "submit_assessment" }`, forcing Opus to review the entire conversation and submit precise scores.
5. Opus returns the structured assessment via tool_use.
6. The assessment is saved to the database.

### Assessment Fields (Weekly)
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| meals | integer | 1-5 | CLOVA-5 nutrition score |
| sleep | integer | 1-5 | CLOVA-5 sleep score |
| health | integer | 1-5 | CLOVA-5 general health score |
| social | integer | 1-5 | CLOVA-5 social contact score |
| mobility | integer | 1-5 | CLOVA-5 mobility score |
| phq2_score | integer | 0-6 | PHQ-2 depression screen total |
| phq2_triggered_cssrs | boolean | — | Whether PHQ-2 >= 3 triggered C-SSRS |
| cssrs_result | string | categorical | none, passive_ideation, active_ideation, plan, intent, prior_attempt |
| ottawa_score | integer | 0-4 | Ottawa 3DY cognitive score |
| summary | string | — | 2-3 sentence narrative summary of the call |

### Assessment Fields (Quarterly — additional)
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| tele_free_cog_score | integer | 0-24 | Telephone cognitive assessment (lower = worse) |
| steadi_score | integer | 0-14 | Fall risk (higher = more risk) |
| ucla_loneliness_score | integer | 3-9 | Loneliness scale (higher = more lonely) |
| lawton_iadl_score | integer | 0-7 | Functional independence (lower = more impaired) |

### What the Tool Does NOT Collect
The agent does not submit a `flag` or `escalation_tier`. These are computed server-side by the scoring pipeline (see Section 11). This prevents inconsistency between Claude's judgment and the rule-based scoring system.

---

## 11. Scoring Pipeline

After the assessment is saved, the post-call job runs `scoreAssessment()` — a deterministic, rule-based function that evaluates every score and returns a flag + escalation entries. The pipeline processes instruments in priority order:

### Priority 1: C-SSRS (Highest)
| Result | Flag | Escalation Tier | Action |
|--------|------|-----------------|--------|
| plan | RED | Immediate | Contact 988/911. Same-day safety assessment. |
| intent | RED | Immediate | Contact 988/911. Same-day safety assessment. |
| prior_attempt | RED | Immediate | Same-day safety assessment. |
| active_ideation | RED | Urgent | Behavioral health referral within 24 hours. |
| passive_ideation | YELLOW | Urgent | Behavioral health referral within 24 hours. |
| none | — | — | No action. |

### Priority 2: PHQ-2
| Condition | Flag | Escalation Tier | Action |
|-----------|------|-----------------|--------|
| Score >= 3 | YELLOW | Routine | Refer to PCP for full PHQ-9 assessment. |
| Score < 3 | — | — | No action. |

### Priority 3: Ottawa 3DY
| Condition | Flag | Escalation Tier | Action |
|-----------|------|-----------------|--------|
| Score <= 2 | YELLOW | Urgent | Possible acute cognitive change. Same-day PCP notification. |
| Score = 3 | — | Routine | Minor errors. Flag for quarterly comprehensive screen. |
| Score = 4 | — | — | Perfect. No action. |

### Priority 4: CLOVA-5 (each metric independently)
| Condition | Flag | Escalation Tier | Action |
|-----------|------|-----------------|--------|
| Any metric <= 2 | YELLOW | Routine | Care coordinator review. Per-metric reason (e.g., "Low Meals score: Nutrition concern"). |
| All metrics >= 3 | — | — | No action. |

### Priority 5: Quarterly Instruments
| Instrument | Condition | Flag | Tier | Action |
|------------|-----------|------|------|--------|
| Tele-Free-Cog | < 15 | RED | Urgent | Possible dementia. Urgent PCP referral + notify family. |
| Tele-Free-Cog | 15-19 | YELLOW | Routine | Possible MCI. Refer to PCP for comprehensive evaluation. |
| Tele-Free-Cog | >= 20 | — | — | No action. |
| STEADI | >= 4 | YELLOW | Routine | High fall risk. Refer to PCP for fall risk assessment. |
| UCLA-3 | >= 7 | YELLOW | Routine | High isolation. Refer to social services. |
| UCLA-3 | = 6 | — | Routine | Moderate loneliness. Flag for social services referral. |
| Lawton IADL | <= 5 | YELLOW | Routine | Functional decline. Loss of 2+ IADLs. Notify caregiver. |

### Flag Priority Rules
- **RED never downgrades**: Once a RED flag is set (by C-SSRS or Tele-Free-Cog), no subsequent green instrument can lower it.
- **YELLOW never downgrades to GREEN**: Once YELLOW is set, it stays at least YELLOW.
- **Multiple YELLOWs don't produce RED**: Even if every CLOVA-5 metric is low AND PHQ-2 is positive AND Ottawa is low, the flag stays YELLOW. Only C-SSRS and Tele-Free-Cog can produce RED.
- **All escalations are cumulative**: A single assessment can produce multiple escalation entries across different tiers.

---

## 12. Post-Call Processing

When Twilio reports a call as `completed` (via the status webhook), `processPostCall()` runs:

1. **Fetch enriched transcript** (async, non-blocking): If Twilio Intelligence is configured, retry up to 4 times (5s, 10s, 20s, 30s delays) to fetch the enriched transcript with word-level timestamps. Store in the call's `enrichedTranscript` JSONB field.

2. **Update person's `lastCallAt`**: Even if no assessment was submitted (incomplete call).

3. **Check for assessment**: If no assessment exists for this call, log it as an incomplete call and stop. This is expected for short calls where the person hangs up early.

4. **Run scoring pipeline**: `scoreAssessment()` produces a flag and escalation array.

5. **Update assessment flag**: Overwrite the placeholder "green" flag with the computed flag.

6. **Update person flag**: Set the person's flag to match the assessment's computed flag.

7. **Create escalations**: For each entry in the escalation array, insert an escalation record.

8. **Send email alerts**: For immediate and urgent escalations only. Emails go to the owning user (the user who created this person). Immediate escalations include a special callout: "This escalation requires same-day follow-up. If suicidal ideation is indicated, contact 988 Suicide & Crisis Lifeline or 911."

9. **Log conversation latency**: If an enriched transcript was fetched, compute per-turn response latency (time between customer finishing speaking and agent starting to speak). Log average, min, and max.

10. **Chain next call**: Queue `process-next-call` with `CALL_GAP_SECONDS` delay to continue the sequential chain.

---

## 13. What Happens When People Don't Answer

### Twilio Status Mapping
| Twilio Status | Internal Status | What Happened |
|---------------|-----------------|---------------|
| queued | scheduled | Call is in Twilio's queue |
| ringing | scheduled | Phone is ringing |
| in-progress | in-progress | Person answered, call is active |
| completed | completed | Call finished normally |
| busy | no-answer | Line was busy |
| no-answer | no-answer | Rang but nobody picked up |
| failed | failed | Twilio couldn't connect (bad number, carrier error) |
| canceled | failed | Call was canceled |

### Current Retry Behavior
**There is no automatic retry for unanswered calls.** If a person doesn't answer:
- The call record is updated to `no-answer` or `failed`.
- The person's `lastCallAt` is NOT updated (only completed calls or WebSocket sessions update it).
- The sequential chain moves on to the next person.
- The person will be picked up again by the scheduler on the next daily run (since they still haven't had a call in 7+ days).

This means an unreachable person will be attempted once per day during the call window until they eventually answer or are paused/discharged.

---

## 14. Call Termination

### Normal End (Assessment Submitted)
1. Claude calls `submit_assessment` tool → assessment is saved.
2. Server sets `endCall = true`.
3. An 8-second timer starts (to let TTS finish speaking the goodbye message).
4. After 8 seconds, server sends `{ type: "end" }` to Twilio → call hangs up.
5. WebSocket closes → `saveTranscript()` updates `lastCallAt` → session deleted from memory.
6. Twilio status webhook fires with `completed` → post-call processing runs.

### Abnormal End (Caller Hangs Up Early)
1. Twilio detects the hangup and closes the WebSocket.
2. `saveTranscript()` runs — updates `lastCallAt` even for incomplete calls.
3. Session is deleted from memory.
4. Twilio status webhook fires. If the call was long enough for some conversation, it may have `completed` status. If very short, `no-answer`.
5. Post-call processing runs. If no assessment was submitted (likely), it logs "No assessment for call X (incomplete call)" and stops.
6. No flag changes, no escalations. The person gets called again next time.

### Technical Failure
If the WebSocket or Claude API errors mid-call:
- The error handler sends "I'm sorry, I'm having a technical difficulty. Let me try again." via TTS.
- The session stays alive — the next `prompt` from Twilio will retry processing.
- If the error is unrecoverable, the WebSocket eventually closes and cleanup runs as above.

---

## 15. Escalation System

### Escalation Data Model
| Field | Description |
|-------|-------------|
| personId | Which person this concerns |
| callId | Which call triggered it |
| tier | `immediate`, `urgent`, or `routine` |
| reason | Short description (e.g., "C-SSRS: Active suicidal ideation with plan/intent") |
| details | Longer description with scores and recommended actions |
| status | `pending`, `acknowledged`, or `resolved` |
| resolvedAt | When it was resolved |
| resolvedBy | Who resolved it (free text) |

### Tier Definitions
| Tier | Response Time | Email Alert | Typical Triggers |
|------|--------------|-------------|-----------------|
| **Immediate** | Same day | Yes | C-SSRS plan/intent/prior attempt. Logged to console as `[IMMEDIATE ESCALATION]`. |
| **Urgent** | 24-48 hours | Yes | C-SSRS active/passive ideation. Ottawa <= 2 (acute cognitive change). Tele-Free-Cog < 15 (possible dementia). |
| **Routine** | Next scheduled visit | No | PHQ-2 >= 3. Low CLOVA-5 metric. STEADI >= 4. UCLA-3 >= 6. Lawton IADL <= 5. Ottawa = 3. |

### Escalation Lifecycle
1. **Created automatically** by the scoring pipeline after every call.
2. **Pending**: Visible in the dashboard. Immediate/urgent trigger email alerts.
3. **Acknowledged**: Care coordinator clicks "Acknowledge" to indicate they've seen it.
4. **Resolved**: Care coordinator clicks "Resolve" with notes on what was done.

### Email Alerts
- Only sent for **immediate** and **urgent** tiers.
- Sent only to the **owning user** (the user who created this person), not all users.
- Email includes: person name, tier badge (color-coded), reason, details, dashboard link.
- Immediate escalations include a red warning box mentioning 988 Suicide & Crisis Lifeline.
- Sent via Resend from `noreply@claudecare.com`.

---

## 16. Twilio Intelligence Integration (Optional)

If `TWILIO_INTELLIGENCE_SERVICE_SID` is configured:

### Enriched Transcripts
- After call completion, the post-call job fetches the enriched transcript from Twilio Intelligence.
- Retries up to 4 times with backoff (5s, 10s, 20s, 30s) since the transcript may still be processing.
- Transcripts include per-sentence timestamps and per-word timestamps.
- Speaker diarization: channel 2 = agent (TTS output), channel 1 = customer (caller's voice).
- Operator results (sentiment, topics) are also fetched if configured.
- Stored as JSONB in the call's `enrichedTranscript` field.

### Webhook URL Sync
On server startup, if Intelligence is configured, the server automatically updates the Intelligence Service's webhook URL to `{BASE_URL}/api/twilio/intelligence`. This ensures the webhook points to the right server after deployment URL changes.

### Conversation Latency Logging
From enriched transcripts, the system computes customer→agent response latency for each turn (time between customer finishing and agent starting). This measures the full roundtrip: STT recognition + Claude API + TTS start. Average, min, and max are logged per call.

---

## 17. Recording & Playback

### Recording
- All calls are recorded (`record: true` in Twilio API call).
- Twilio sends the recording URL via the recording status callback webhook (`/api/twilio/recording`).
- The URL is stored in the call's `recordingUrl` field.

### Playback
- The dashboard streams recordings via `GET /api/calls/:id/recording`.
- The server proxies the request to Twilio with Basic Auth (`TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN`).
- Audio is served as `audio/mpeg` (Twilio recording URL + `.mp3` suffix for compressed format).
- This server-side proxy prevents exposing Twilio credentials to the client.

---

## 18. Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | — | PostgreSQL (Neon) connection string |
| BETTER_AUTH_SECRET | Yes | — | Session signing secret |
| TWILIO_ACCOUNT_SID | Yes | — | Twilio account SID |
| TWILIO_AUTH_TOKEN | Yes | — | Twilio auth token + signature validation |
| TWILIO_PHONE_NUMBER | Yes | — | Outbound caller ID |
| ANTHROPIC_API_KEY | Yes | — | Claude API key |
| RESEND_API_KEY | Yes | — | Email service key |
| PORT | No | 3000 | Server port |
| BASE_URL | No | http://localhost:3000 | Public URL (used for webhooks, CORS, emails) |
| CALL_WINDOW_START | No | 09:00 | Daily call window start (HH:MM) |
| CALL_WINDOW_END | No | 17:00 | Daily call window end (HH:MM) |
| CALL_WINDOW_TZ | No | America/New_York | Timezone for call window |
| CALL_GAP_SECONDS | No | 10 | Delay between sequential calls |
| TWILIO_INTELLIGENCE_SERVICE_SID | No | — | Enables enriched transcripts |

All required variables are validated at startup via Zod. If any are missing, the server logs exactly which ones and exits.

---

## 19. Database Schema

### App Tables
- **persons**: id, userId (FK), name, phone, contacts, notes, status, flag, lastCallAt, callCount, timestamps
- **calls**: id, personId (FK), callType, callSid, status, duration, recordingUrl, enrichedTranscript (JSONB), transcriptSid, summary, scheduledFor, startedAt, completedAt, errorMessage, timestamps
- **assessments**: id, callId (FK), personId (FK), CLOVA-5 metrics (x5), PHQ-2 score, C-SSRS fields, Ottawa score, quarterly instrument scores (x4), flag, timestamp
- **escalations**: id, personId (FK), callId (FK), tier, reason, details, status, resolvedAt, resolvedBy, timestamp

### Auth Tables (better-auth)
- **user**: id, name, email, emailVerified, image, timestamps
- **session**: id, token, expiresAt, userId (FK), timestamps
- **account**: id, accountId, providerId, userId (FK), tokens, timestamps
- **verification**: id, identifier, value, expiresAt, timestamps

All tables use snake_case in PostgreSQL. Drizzle schema is defined in camelCase with automatic snake_case mapping (`casing: "snake_case"`).

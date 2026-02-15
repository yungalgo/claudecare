# ClaudeCare — Business Logic

## What ClaudeCare Does

ClaudeCare is an AI-powered wellness monitoring platform for organizations that serve older adults (senior living facilities, home health agencies, Area Agencies on Aging, etc.). It makes automated weekly phone calls to enrolled seniors, runs validated clinical screening instruments through natural conversation, and alerts care coordinators when someone needs attention.

---

## Core Entities

### User (Organization Admin / Care Coordinator)
- Signs up with org name, email, password
- Manages persons (CRUD + CSV bulk upload)
- Views dashboards, call history, assessment trends, escalations
- Acknowledges and resolves escalations
- Can manually trigger calls

### Person (Senior / Client)
- Enrolled by a user (name, phone required)
- Optional: emergency contact (name + phone), PCP (name + phone), notes
- Has a **status**: `active`, `paused`, `discharged`
- Has a **flag**: `green` (stable), `yellow` (monitor), `red` (alert)
- Receives automated weekly calls when active

### Call
- Created automatically by the daily scheduler, or manually triggered
- Types: `weekly` (standard) or `quarterly` (extended instruments)
- Statuses: `scheduled` → `in-progress` → `completed` / `failed` / `no-answer`
- Records: Twilio call SID, duration, recording URL, transcript, AI summary

### Assessment
- One per call, submitted by Claude via tool_use at end of conversation
- Contains all screening scores (see Screening Instruments below)
- Has its own computed **flag** (green/yellow/red)

### Escalation
- Created automatically when scoring detects a concern
- **Tiers**: `immediate` (same-day action), `urgent` (24-48hr), `routine` (next visit)
- **Statuses**: `pending` → `acknowledged` → `resolved`
- Immediate and urgent escalations trigger email alerts to all registered users

---

## Call Flow (End to End)

```
1. SCHEDULING
   pg-boss cron (daily 9 AM) → finds active persons with no call in 7+ days
   → creates call record (status: scheduled) → queues "process-call" job

2. CALL INITIATION
   process-call worker → looks up person → checks status is active
   → calls Twilio API to initiate outbound call
   → Twilio calls the person's phone number

3. TWILIO VOICE WEBHOOK
   Person answers → Twilio hits POST /api/twilio/voice/answer
   → Returns TwiML with <ConversationRelay> pointing to wss://claudecare.com/ws/conversation-relay
   → Twilio opens WebSocket connection to our server

4. REAL-TIME CONVERSATION (WebSocket)
   Twilio handles STT (speech-to-text) and TTS (text-to-speech)
   Our server receives text, sends it to Claude Opus, returns Claude's response
   Claude follows the 6-phase protocol (see below)

5. ASSESSMENT SUBMISSION
   At end of call, Claude calls the submit_assessment tool
   → Assessment record created with all scores
   → Call record updated with transcript + summary
   → Person flag updated

6. POST-CALL PROCESSING
   post-call worker → re-scores the assessment using scoring pipeline
   → Updates assessment flag and person flag
   → Creates escalation records for any flagged concerns
   → Sends email alerts for immediate/urgent escalations

7. STATUS CALLBACKS
   Twilio sends call status updates (initiated, ringing, answered, completed, failed)
   → POST /api/twilio/status updates the call record
   Twilio sends recording URL when ready
   → POST /api/twilio/recording updates the call record
```

---

## 6-Phase Call Protocol

Claude Opus follows this exact protocol on every weekly call:

### Phase 1 — Opening (30-60s)
Greet person by name. Ask how they're doing. Listen for speech coherence.

### Phase 2 — CLOVA-5 Health Metrics (90-120s)
Natural conversation covering 5 areas, each scored 1 (poor) to 5 (good):
- **Meals** — Eating regularly? What did they eat?
- **Sleep** — Sleeping well? Trouble falling/staying asleep?
- **Health** — Physical complaints? New symptoms? ER visits?
- **Social** — Visitors? Getting out? Talking to people?
- **Mobility** — Moving around okay? Falls or near-falls?

### Phase 3 — PHQ-2 Depression Screen (30-60s)
Two standardized questions about last two weeks:
1. Little interest or pleasure in doing things? (0-3)
2. Feeling down, depressed, or hopeless? (0-3)

Total: 0-6. **If >= 3 → triggers C-SSRS (Phase 3a)**

### Phase 3a — C-SSRS Suicide Safety (only if PHQ-2 >= 3)
Columbia Suicide Severity Rating Scale questions:
- Passive ideation (wished dead) → **urgent** escalation
- Active ideation (thoughts of killing self) → **urgent** escalation
- Plan or intent → **immediate** escalation (mention 988 hotline)
- Prior attempt → **immediate** escalation

### Phase 4 — Needs Assessment (60-90s)
- Enough food and supplies?
- Taking medications? Trouble with refills?
- Need help around the house?
- Feel safe at home?

### Phase 5 — Ottawa 3DY Cognitive Quick-Check (30s)
Embedded naturally at close. 1 point each (total 0-4):
- What day of the week is it?
- What's today's date?
- What year is it?
- Spell WORLD backwards

### Phase 6 — Close (30s)
Ask if anything else on their mind. Confirm next call day. Say goodbye warmly.

---

## Screening Instruments & Scoring

### Weekly Instruments

| Instrument | Range | What it Measures |
|-----------|-------|-----------------|
| CLOVA-5 (x5) | 1-5 each | Meals, sleep, health, social, mobility |
| PHQ-2 | 0-6 | Depression screening |
| C-SSRS | categorical | Suicide risk (only if PHQ-2 >= 3) |
| Ottawa 3DY | 0-4 | Cognitive orientation |

### Quarterly Instruments (future)

| Instrument | Range | What it Measures |
|-----------|-------|-----------------|
| Tele-Free-Cog | 0-24 | Cognitive function (dementia/MCI screening) |
| STEADI | 0-14 | Fall risk |
| UCLA-3 | 3-9 | Loneliness / social isolation |
| Lawton IADL | 0-7 | Functional independence |

---

## Scoring Pipeline (Priority Order)

The scoring pipeline evaluates an assessment and returns a **flag** (green/yellow/red) + **escalation entries**. Higher-severity findings take priority:

### 1. C-SSRS (Highest Priority)
| Result | Flag | Escalation |
|--------|------|-----------|
| Plan or intent | RED | **Immediate** — Contact 988/911 |
| Prior attempt | RED | **Immediate** — Safety assessment |
| Active ideation | RED | **Urgent** — Behavioral health within 24h |
| Passive ideation | YELLOW | **Urgent** — Behavioral health within 24h |

### 2. PHQ-2
| Score | Flag | Escalation |
|-------|------|-----------|
| >= 3 | YELLOW | **Routine** — Refer to PCP for full PHQ-9 |

### 3. Ottawa 3DY
| Score | Flag | Escalation |
|-------|------|-----------|
| <= 2 | YELLOW | **Urgent** — Possible acute cognitive change, same-day PCP |
| 3 | — | **Routine** — Flag for quarterly comprehensive screen |

### 4. CLOVA-5 (each metric independently)
| Score | Flag | Escalation |
|-------|------|-----------|
| <= 2 on any metric | YELLOW | **Routine** — Care coordinator review |

### 5. Quarterly Instruments
| Instrument | Threshold | Flag | Escalation |
|-----------|-----------|------|-----------|
| Tele-Free-Cog < 15 | Possible dementia | RED | **Urgent** |
| Tele-Free-Cog < 20 | Possible MCI | YELLOW | **Routine** |
| STEADI >= 4 | High fall risk | YELLOW | **Routine** |
| UCLA-3 >= 7 | High isolation | YELLOW | **Routine** |
| Lawton IADL <= 5 | Functional decline | YELLOW | **Routine** |

---

## Flag System

| Flag | Meaning | Action |
|------|---------|--------|
| **Green** | Stable | No action needed. Continue weekly calls. |
| **Yellow** | Monitor | Care coordinator should review at next opportunity. May need PCP referral. |
| **Red** | Alert | Immediate or urgent follow-up required. Escalation created automatically. |

A person's flag is the **worst flag from their most recent assessment**. It updates after every call.

---

## Escalation Tiers & Actions

| Tier | Response Time | Email Alert | Examples |
|------|--------------|-------------|---------|
| **Immediate** | Same day | Yes (all users) | Active suicidal ideation with plan, prior attempt |
| **Urgent** | 24-48 hours | Yes (all users) | Active/passive ideation, acute cognitive change, possible dementia |
| **Routine** | Next scheduled visit | No | Positive PHQ-2, low CLOVA metric, fall risk, loneliness |

### Escalation Lifecycle
1. **Pending** — Auto-created by scoring pipeline after a call
2. **Acknowledged** — Care coordinator has seen it and is taking action
3. **Resolved** — Follow-up completed, issue addressed

---

## Email Notifications (via Resend)

| Trigger | Recipients | Content |
|---------|-----------|---------|
| Password reset request | The requesting user | Reset link (expires 1 hour) |
| Immediate escalation | All registered users | Person name, reason, details, dashboard link, 988 hotline note |
| Urgent escalation | All registered users | Person name, reason, details, dashboard link |

---

## Authentication

- **Provider**: better-auth (email + password)
- **Sessions**: Cookie-based, 5-minute server-side cache
- **Protected routes**: All `/api/*` except `/api/auth/*`, `/api/twilio/*`, `/api/health`
- **Password reset**: Generates token → sends email via Resend → user sets new password
- **Authorization**: Currently single-tenant (all users see all persons). Multi-tenancy is a future enhancement.

---

## Scheduling

- **Daily 9 AM cron** (pg-boss): Finds all active persons whose `last_call_at` is null or > 7 days ago
- Creates a call record for each, queues a `process-call` job
- Calls are staggered by pg-boss's built-in queue processing
- Manual calls can be triggered anytime from the person detail page

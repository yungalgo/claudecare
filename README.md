# Claude Care

**[claudecare.com](https://claudecare.com)**

AI-powered wellness monitoring for isolated seniors. Automated phone calls run validated clinical screenings through warm, natural conversation, catching risks early and alerting care teams when someone needs help.

Built for organizations that serve older adults: senior living facilities, home health agencies, Area Agencies on Aging.

---

## How It Works

ClaudeCare calls enrolled seniors on a configurable schedule. Each call follows a 6-phase clinical protocol conducted by an AI agent that sounds like a friendly, patient human caller. After the call, a scoring pipeline evaluates responses against clinical thresholds and surfaces escalations to care coordinators.

### User Journey

1. **Care coordinator** signs up, uploads a CSV of seniors (name + phone), or adds them individually.
2. **Scheduler** automatically calls each active person based on their schedule (twice-weekly, weekly, or biweekly).
3. **AI agent** conducts a 5-8 minute wellness check: asks about meals, sleep, health, social contact, mobility, then runs depression and cognitive screens.
4. **Scoring pipeline** evaluates responses against clinical cutoffs. Flags the person green/yellow/red.
5. **Escalations** are created for any concerning scores. Immediate and urgent escalations trigger email alerts.
6. **Dashboard** shows all persons, flags, call history, assessment trends, and escalation queue.

### Call Types

| Type | Duration | Content | When |
|------|----------|---------|------|
| **Standard** | 5-8 min | CLOVA-5, PHQ-2, C-SSRS (conditional), Ottawa 3DY, needs assessment | Every scheduled call |
| **Comprehensive** | 12-15 min | All standard instruments + Tele-Free-Cog, STEADI, UCLA-3, Lawton IADL | Every 13th call (automatic) or manual trigger |
| **Check-in** | 5-10 min | Casual conversation, no clinical screening | Inbound calls when person isn't due |

### Call Schedules

| Schedule | Interval | Use Case |
|----------|----------|----------|
| Twice-weekly | 3 days | High-risk, red-flagged, post-event (CLOVA CareCall protocol) |
| Weekly | 7 days | Standard ongoing monitoring |
| Biweekly | 14 days | Stable, green-flagged persons |

---

## Clinical Instruments

All instruments are peer-reviewed and validated for telephone administration.

| Instrument | What It Measures | Range | Escalation Threshold |
|------------|-----------------|-------|---------------------|
| **CLOVA-5** | Meals, sleep, health, social contact, mobility | 1-5 each | Any metric <= 2 |
| **PHQ-2** | Depression screen | 0-6 | >= 3 triggers C-SSRS |
| **C-SSRS** | Suicide risk (conditional) | Categorical | Any positive response |
| **Ottawa 3DY** | Cognitive quick-check | 0-4 | <= 2 = urgent |
| **Tele-Free-Cog** | Telephone cognitive assessment | 0-24 | < 15 = possible dementia |
| **STEADI** | Fall risk | 0-14 | >= 4 = high risk |
| **UCLA-3** | Loneliness | 3-9 | >= 7 = high isolation |
| **Lawton IADL** | Functional independence | 0-7 | <= 5 = decline |

### Dual-Model Architecture

Real-time conversation uses **Claude Haiku 4.5** for low latency. When the call ends, the full transcript is re-evaluated by **Claude Opus 4.6** for accurate clinical scoring. The agent never assigns flags or escalation tiers — those are computed deterministically by the server-side scoring pipeline.

---

## Architecture

Single Bun process serving HTTP, WebSocket, and background jobs. No separate workers, no microservices.

```
                                 +------------------+
                                 |   React SPA      |
                                 |   (Vite build)   |
                                 +--------+---------+
                                          |
                                    HTTPS | /api/*
                                          |
+------------------+             +--------+---------+            +------------------+
|   Twilio         |  WebSocket  |   Bun.serve      |  Drizzle   |   PostgreSQL     |
|   ConversationRelay +---------->   Hono + WS      +------------>   (Neon)         |
|   (voice + STT/TTS)|          |   pg-boss workers |            |   + pg-boss      |
+--------+---------+             +--------+---------+            +------------------+
         |                                |
   Status webhooks                        |  Anthropic SDK
   Recording webhooks             +-------+--------+
   Intelligence webhooks          |                |
                           +------+------+  +------+------+
                           | Claude      |  | Claude      |
                           | Haiku 4.5   |  | Opus 4.6    |
                           | (real-time) |  | (scoring)   |
                           +-------------+  +-------------+
```

### Call Flow

```
pg-boss cron (CALL_WINDOW_START)
  -> scheduleNextCall() finds next due person
  -> creates call record + queues process-call
  -> Twilio initiates outbound call with single-use WS token
  -> person answers, Twilio opens WebSocket to /ws/conversation-relay
  -> Claude Haiku runs 6-phase protocol turn-by-turn
  -> Claude calls submit_assessment tool -> Opus re-scores full transcript
  -> assessment + summary saved to DB
  -> Twilio status webhook fires post-call job
  -> scoring pipeline computes flag + escalations
  -> chains process-next-call immediately
  -> loop continues until CALL_WINDOW_END
```

### Key Design Decisions

**Sequential call processing.** Calls are made one at a time, not in parallel. This simplifies resource management, prevents overwhelming Twilio rate limits, and ensures the system stays within API budgets. The next call is queued immediately after post-call processing completes.

**Deterministic scoring, not AI scoring.** The AI agent collects data through conversation. All clinical flag/escalation decisions are made by a rule-based scoring function with hardcoded thresholds from clinical literature. This ensures reproducibility and auditability.

**Single-use WebSocket tokens.** Each call generates a cryptographic token with a 5-minute TTL. The token is consumed on first use and cannot be replayed. This authenticates the WebSocket connection without exposing session credentials to Twilio.

**Call type vs call schedule separation.** "Call type" (standard/comprehensive/check-in) describes what protocol runs during a call. "Call schedule" (twice-weekly/weekly/biweekly) describes how often a person is called. These are independent — a person on any schedule gets standard calls most of the time, with comprehensive calls every 13th completed call.

**Phase tracking via heuristics, not state machines.** Claude follows the protocol from its system prompt. The server tracks phases by keyword-matching Claude's responses (e.g., mentions of "meals" = CLOVA-5 phase). This avoids rigid state machine constraints while still giving Claude phase context.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) (TypeScript natively, no transpile for server) |
| Server | [Hono](https://hono.dev) on Bun.serve |
| Database | PostgreSQL ([Neon](https://neon.tech) serverless) via [Drizzle ORM](https://orm.drizzle.team) |
| Jobs | [pg-boss](https://github.com/timgit/pg-boss) (PostgreSQL-backed queue + cron) |
| Voice | [Twilio ConversationRelay](https://www.twilio.com/docs/voice/twiml/connect/conversationrelay) (WebSocket real-time voice) |
| AI | [Anthropic SDK](https://docs.anthropic.com) — Claude Haiku 4.5 (conversation) + Claude Opus 4.6 (assessment) |
| Auth | [better-auth](https://www.better-auth.com) (email + password, cookie sessions) |
| Email | [Resend](https://resend.com) (escalation alerts) |
| Client | React 19 + React Router 7 + Tailwind CSS 4 + Recharts |
| Build | Vite (client only, output to `dist/client/`, served by Hono) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- PostgreSQL database ([Neon](https://neon.tech) free tier works)
- [ngrok](https://ngrok.com) (for Twilio webhooks in dev)
- Twilio account with a phone number and ConversationRelay enabled
- Anthropic API key
- Resend API key

### Setup

```bash
# Clone
git clone https://github.com/your-org/claudecare.git
cd claudecare

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Fill in all required values (see Environment Variables below)

# Push database schema
bun run db:push

# Start development (ngrok + server + vite)
bun run dev
```

The `bun run dev` command starts ngrok, the Bun server with hot reload, and the Vite dev server simultaneously. It automatically sets `BASE_URL` to the ngrok tunnel URL so Twilio webhooks work.

For local-only development (no ngrok):

```bash
bun run dev:local
```

### Database GUI

```bash
bun run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio` for browsing and editing data.

---

## Testing a Call

### From the Dashboard

1. Start the dev server: `bun run dev`
2. Open `http://localhost:5173` and sign up
3. On the Dashboard, use the "Try a Demo Call" card: enter your phone number, select Standard or Comprehensive, click "Call Me"
4. Your phone rings. Answer and have a conversation with the AI agent.
5. After the call, refresh the dashboard to see the assessment, flag, and any escalations.

### Via Script

```bash
# Requires the dev server to be running
bun run test:call
```

This creates a test person (if needed) and triggers a call via the dev endpoint. Watch the server logs for real-time WebSocket and Claude activity.

### Via API

```bash
# Create a person
curl -X POST http://localhost:3000/api/persons \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"name": "Test User", "phone": "+15551234567"}'

# Trigger a call
curl -X POST http://localhost:3000/api/calls/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"personId": "<uuid>", "callType": "standard"}'
```

---

## Running Tests

```bash
bun test
```

Tests cover the scoring pipeline (`src/server/lib/scoring.test.ts`) with cases for every instrument, threshold, and flag combination.

---

## Deploying

ClaudeCare runs as a single process. Any platform that supports Bun or Node.js works.

### Railway (recommended)

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add a PostgreSQL database
3. Set all environment variables (see below)
4. Build command: `bun run build`
5. Start command: `bun run start`
6. Set `BASE_URL` to your Railway deployment URL

### Any Platform

```bash
# Build the client
bun run build

# Start the server (serves API + static client)
bun run start
```

The server serves the React SPA from `dist/client/` and all API routes. No separate frontend hosting needed.

### Twilio Configuration

After deploying, configure these webhook URLs in your Twilio console:

| Setting | URL |
|---------|-----|
| Voice "A call comes in" | `https://your-domain.com/api/twilio/voice/inbound` |
| Status callback | `https://your-domain.com/api/twilio/status` |

The voice answer URL and recording callback URL are set automatically per-call via the Twilio API.

---

## Environment Variables

All required variables are validated at startup via Zod. The server exits with a clear error if any are missing.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | | Session signing secret (random string) |
| `TWILIO_ACCOUNT_SID` | Yes | | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes | | Twilio phone number (E.164 format) |
| `ANTHROPIC_API_KEY` | Yes | | Anthropic API key |
| `RESEND_API_KEY` | Yes | | Resend API key |
| `BASE_URL` | No | `http://localhost:3000` | Public URL (webhooks, CORS, emails) |
| `PORT` | No | `3000` | Server port |
| `CALL_WINDOW_START` | No | `09:00` | Daily call window start (HH:MM) |
| `CALL_WINDOW_END` | No | `17:00` | Daily call window end (HH:MM) |
| `CALL_WINDOW_TZ` | No | `America/New_York` | Timezone for call window |
| `TWILIO_INTELLIGENCE_SERVICE_SID` | No | | Enables enriched transcripts |

---

## Project Structure

```
src/
  server/
    index.ts              # Bun.serve entry — HTTP, WebSocket, workers
    env.ts                # Zod-validated environment variables
    types.ts              # Shared Hono AppVariables type
    lib/
      schema.ts           # Drizzle schema (persons, calls, assessments, escalations)
      db.ts               # Database connection
      constants.ts        # Call types, schedules, intervals (single source of truth)
      claude.ts           # System prompts + assessment tool definitions
      twilio.ts           # Call initiation, WS tokens, signature middleware
      scoring.ts          # Deterministic scoring pipeline
      scoring.test.ts     # Scoring test suite
      escalation.ts       # Escalation creation + email alerts
      auth.ts             # better-auth configuration
      email.ts            # Resend email client
      intelligence.ts     # Twilio Intelligence enriched transcripts
    ws/
      protocol.ts         # Conversation state, Claude message handling, phase tracking
      handler.ts          # WebSocket message router (setup/prompt/interrupt/dtmf)
    jobs/
      boss.ts             # pg-boss init + worker registration
      scheduler.ts        # Sequential call scheduling
      call-processor.ts   # Twilio call initiation
      post-call.ts        # Scoring, escalations, transcript enrichment
    routes/
      persons.ts          # CRUD + CSV upload
      calls.ts            # List, trigger, recording proxy
      assessments.ts      # List assessments
      escalations.ts      # List, acknowledge, resolve
      analytics.ts        # Aggregate stats
      twilio/
        voice.ts          # Outbound answer + inbound call handling
        status.ts         # Call status webhook + retry logic
        recording.ts      # Recording URL webhook
        intelligence.ts   # Enriched transcript webhook
  client/
    pages/
      Landing.tsx         # Marketing page
      Dashboard.tsx       # Person list + demo call card
      Person.tsx          # Person detail + call history + trends
      Calls.tsx           # All calls across persons
      Escalations.tsx     # Escalation queue
      Analytics.tsx       # Aggregate charts
      Upload.tsx          # CSV upload
    components/
      ui.tsx              # Custom UI components (Card, Badge, Button, etc.)
      AudioPlayer.tsx     # Recording playback with enriched transcript
    lib/
      api.ts              # Fetch wrapper for all API calls
  scripts/
    dev.ts                # Dev orchestrator (ngrok + server + vite)
    test-call.ts          # Manual call trigger for testing
```

---

## Security

- **Multi-tenant isolation**: All queries scoped by `userId` from session. No cross-tenant data access.
- **Twilio webhook validation**: All `/api/twilio/*` routes validate `x-twilio-signature` using the auth token.
- **WebSocket authentication**: Single-use cryptographic tokens with 5-minute TTL.
- **Rate limiting**: 120 req/min general API limit, 5 req/min on call trigger endpoint (prevents credit drain).
- **Input validation**: Zod schemas on all mutation endpoints. Call type validated as enum.
- **CORS**: Restricted to `BASE_URL` in production. Localhost origins only allowed in dev.
- **Session auth**: Cookie-based sessions via better-auth with server-side validation.

---

## License

Proprietary. All rights reserved.

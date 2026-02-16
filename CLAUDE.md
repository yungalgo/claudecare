# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev (server with hot reload)
bun run dev

# Dev (client Vite dev server with HMR, proxies /api to :3000)
bun run dev:vite

# Build client for production
bun run build

# Start production server
bun run start

# Push schema changes to database
bun run db:push

# Open Drizzle Studio (DB GUI)
bun run db:studio
```

Run both `bun run dev` and `bun run dev:vite` simultaneously during development.

## Architecture

Single Bun process serving HTTP (Hono), WebSocket (Twilio ConversationRelay), and background jobs (pg-boss) — no separate worker processes. Multi-tenant: all data scoped by `userId`.

**Call flow (sequential):** pg-boss cron at `CALL_WINDOW_START` fires `schedule-calls` → `scheduleNextCall()` finds next active person due (no call in 7+ days) → creates call record → queues `process-call` → Twilio initiates call with WS token → Twilio connects WebSocket to `/ws/conversation-relay` (token-authenticated) → Claude Opus 4.6 runs 6-phase conversation protocol → Claude submits assessment via tool_use → protocol saves assessment + transcript → Twilio status webhook fires `post-call` job → scoring pipeline runs → updates person flag → creates escalations → chains `process-next-call` after `CALL_GAP_SECONDS` delay → loop continues until `CALL_WINDOW_END`.

**Scoring pipeline** (`src/server/lib/scoring.ts`): C-SSRS result (highest priority) → PHQ-2 (≥3 triggers escalation) → Ottawa 3DY → CLOVA 5 individual metrics (any ≤2 flags) → quarterly instruments. Returns a flag and array of escalation objects.

## Key Paths

- **Server entry:** `src/server/index.ts` — Bun.serve with HTTP + WebSocket (token-auth on upgrade)
- **DB schema:** `src/server/lib/schema.ts` — 4 app tables (persons, calls, assessments, escalations) + better-auth tables
- **Types:** `src/server/types.ts` — shared Hono `AppVariables` type (userId, userEmail)
- **Claude integration:** `src/server/lib/claude.ts` — system prompt, assessment tool definition
- **Twilio integration:** `src/server/lib/twilio.ts` — call initiation, WS token system, signature validation middleware
- **WS protocol:** `src/server/ws/protocol.ts` — conversation state, Claude message history, tool_use handling
- **WS handler:** `src/server/ws/handler.ts` — setup/prompt/interrupt/dtmf handlers, uses `ws.data` from token
- **Jobs:** `src/server/jobs/` — boss.ts (init + workers), scheduler.ts (sequential), call-processor.ts, post-call.ts
- **API routes:** `src/server/routes/` — persons, calls, assessments, escalations, analytics, twilio webhooks
- **Client pages:** `src/client/pages/` — Dashboard, Person, Calls, Escalations, Analytics, Upload

## Environment Variables

All required — server crashes on startup if any are missing or empty:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (also used for signature validation) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number to call from |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `RESEND_API_KEY` | Resend API key for emails |
| `BASE_URL` | Public URL of the server (default: `http://localhost:3000`) |
| `PORT` | Server port (default: `3000`) |
| `CALL_WINDOW_START` | Daily call window start time (default: `09:00`) |
| `CALL_WINDOW_END` | Daily call window end time (default: `17:00`) |
| `CALL_WINDOW_TZ` | Timezone for call window (default: `America/New_York`) |
| `CALL_GAP_SECONDS` | Delay between sequential calls (default: `10`) |

## Tech Stack

- **Runtime:** Bun (runs TypeScript natively, no transpile step for server)
- **Server:** Hono on Bun.serve
- **Database:** PostgreSQL (Neon serverless) via Drizzle ORM with snake_case mapping
- **Jobs:** pg-boss (PostgreSQL-backed queue + cron)
- **Voice:** Twilio ConversationRelay (WebSocket-based real-time voice)
- **AI:** Anthropic SDK → Claude Opus 4.6 with tool_use for assessment submission
- **Client:** React 19 + React Router 7 + Tailwind CSS 4 + Recharts
- **Build:** Vite (client only, output to `dist/client/`, served by Hono as static files)

## Conventions

- Path alias `~/` maps to `src/` (configured in both tsconfig and vite)
- Drizzle uses `casing: "snake_case"` — define schema in camelCase, DB columns auto-snake
- Server env vars validated via zod in `src/server/env.ts` — crashes on missing vars (no fallbacks)
- All API routes scoped by `userId` from session (set in middleware)
- Twilio webhooks validated via `x-twilio-signature` middleware
- WebSocket connections require single-use token (5-min TTL) generated at call initiation
- API client wrapper in `src/client/lib/api.ts` — all fetch calls go through this
- UI components are custom (not shadcn) in `src/client/components/ui.tsx`
- CORS restricted to `BASE_URL` + localhost:5173 (dev)

## Reference Code

Check `references/claude-cookbooks` and `references/skills` (git submodules) for existing Anthropic patterns, examples, and reusable code before writing from scratch.

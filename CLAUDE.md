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

Single Bun process serving HTTP (Hono), WebSocket (Twilio ConversationRelay), and background jobs (pg-boss) — no separate worker processes.

**Call flow:** pg-boss cron (daily 9 AM) → finds active persons with no call in 7+ days → queues `process-call` job → Twilio initiates call → Twilio connects WebSocket to `/ws/conversation-relay` → Claude Opus 4.6 runs 6-phase conversation protocol (greeting → CLOVA 5 → PHQ-2 → C-SSRS if triggered → needs/Ottawa 3DY → close) → Claude submits assessment via tool_use → `post-call` job scores it → updates person flag (green/yellow/red) → creates escalations if needed.

**Scoring pipeline** (`src/server/lib/scoring.ts`): C-SSRS result (highest priority) → PHQ-2 (≥3 triggers escalation) → Ottawa 3DY → CLOVA 5 individual metrics (any ≤2 flags) → quarterly instruments. Returns a flag and array of escalation objects.

## Key Paths

- **Server entry:** `src/server/index.ts` — Bun.serve with HTTP + WebSocket
- **DB schema:** `src/server/lib/schema.ts` — 4 tables: persons, calls, assessments, escalations
- **Claude integration:** `src/server/lib/claude.ts` — system prompt, assessment tool definition
- **WS protocol:** `src/server/ws/protocol.ts` — conversation state, Claude message history, tool_use handling
- **Jobs:** `src/server/jobs/` — boss.ts (init), scheduler.ts (cron), call-processor.ts, post-call.ts
- **API routes:** `src/server/routes/` — persons, calls, assessments, escalations, twilio webhooks
- **Client pages:** `src/client/pages/` — Dashboard, Person, Calls, Escalations, Upload

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
- Server env vars validated via zod in `src/server/env.ts` with dev defaults
- API client wrapper in `src/client/lib/api.ts` — all fetch calls go through this
- UI components are custom (not shadcn) in `src/client/components/ui.tsx`

## Reference Code

Check `references/claude-cookbooks` and `references/skills` (git submodules) for existing Anthropic patterns, examples, and reusable code before writing from scratch.

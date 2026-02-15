# Checkpoint — claudecare Build Progress

**Date:** 2026-02-15
**Branch:** master (no commits yet for new code — all uncommitted)

---

## What's Done

### Step 0: Reference Docs — DONE
- 8 doc files saved to `docs/`: hono, drizzle, pg-boss, twilio-conversation-relay, better-auth, anthropic-sdk, shadcn-ui, bun
- Hackathon rules copied to `docs/hackathon/rules.md`
- Docs are summaries fetched via WebFetch (not full copy-paste from source sites — they were behind JS rendering or markdown.new gave summaries)

### Step 0.5: Color Palette — DONE
- **Option A "Calm Harbor"** selected and baked into `src/client/index.css` via `@theme` block
- Primary: `#2563EB` (blue), Secondary: `#0F766E` (teal), Accent: `#F59E0B` (amber)
- Success/Warning/Danger: green/yellow/red standard
- Background: `#F8FAFC`, Card: `#FFFFFF`

### Step 1: Project Init & Dependencies — DONE
- `bun init -y` in existing repo (not `bun create hono@latest` — would have overwritten research/planning files)
- All deps installed: hono, postgres, drizzle-orm, pg-boss, @anthropic-ai/sdk, twilio, better-auth, zod, react, react-dom, react-router, recharts, sonner, papaparse
- Dev deps: drizzle-kit, vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, @types/papaparse
- Config files: `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, `package.json` (scripts: dev, dev:vite, build, start, db:push, db:studio)
- `.env.example` with all required env vars
- `.gitignore` updated (node_modules, dist, .env, bun.lock, drizzle/, IDE dirs)
- `src/client/index.html` — Vite SPA entry point
- `public/favicon.svg` — simple blue clock icon

### Step 2: Server Skeleton — DONE
- `src/server/index.ts` — Hono app + Bun.serve with HTTP + WebSocket on same port
- Health check at `/api/health` returns `{ ok: true, name: "claudecare" }`
- Serves React SPA static files in production (`dist/client/`)
- WebSocket upgrade at `/ws/conversation-relay` for Twilio ConversationRelay
- Dynamic import of pg-boss workers on startup
- `src/server/env.ts` — Zod env validation with dev-friendly defaults

### Step 3: Database & Schema — DONE
- `src/server/lib/schema.ts` — 4 tables defined with Drizzle:
  - **persons**: id, name, phone, emergencyContactName/Phone, pcpName/Phone, notes, status, flag, lastCallAt, callCount, timestamps
  - **calls**: id, personId (FK), callType, callSid, status, duration, recordingUrl, transcript, summary, scheduledFor, timestamps
  - **assessments**: id, callId (FK), personId (FK), CLOVA 5 metrics (meals/sleep/health/social/mobility), PHQ-2, C-SSRS, Ottawa 3DY, quarterly instruments (Tele-Free-Cog, STEADI, UCLA-3, Lawton IADL), flag, timestamp
  - **escalations**: id, personId (FK), callId (FK), tier, reason, details, status, resolvedAt/By, timestamp
- `src/server/lib/db.ts` — Drizzle + postgres driver with `casing: "snake_case"`
- `drizzle.config.ts` — points to schema, PostgreSQL dialect

### Step 4: API Routes (CRUD) — DONE
- `src/server/routes/persons.ts` — GET (list w/ search), GET /:id, POST, PATCH /:id, DELETE /:id, POST /upload (CSV bulk)
- `src/server/routes/calls.ts` — GET (list, filter by personId), GET /:id, POST /trigger (manual call)
- `src/server/routes/assessments.ts` — GET (by personId, last 52 weeks), GET /:id
- `src/server/routes/escalations.ts` — GET (filter by status/personId, joins person name), PATCH /:id/acknowledge, PATCH /:id/resolve
- `src/server/routes/twilio/voice.ts` — TwiML endpoint returns ConversationRelay XML
- `src/server/routes/twilio/status.ts` — Call status webhook, maps Twilio statuses to our schema
- `src/server/routes/twilio/recording.ts` — Recording URL webhook
- All routes wired into `src/server/index.ts`

### Step 5: React SPA Shell — DONE
- `src/client/main.tsx` — React 19, BrowserRouter, Toaster (sonner)
- `src/client/App.tsx` — Layout with top nav (logo, Dashboard, Calls, Escalations, Upload), react-router Routes
- `src/client/index.css` — Tailwind v4 with `@theme` block for full design tokens
- `src/client/lib/api.ts` — Typed fetch wrapper (get/post/patch/delete)
- `src/client/components/ui.tsx` — Hand-rolled components: Badge, Button, Input, Card, Spinner, EmptyState, FlagBadge, TierBadge (no shadcn CLI init — built directly with Tailwind)

### Step 6: Dashboard & Person Pages (UI) — DONE
- `src/client/pages/Dashboard.tsx` — Stats cards (total/green/yellow/red), search bar, person table with flag badges, links to person detail
- `src/client/pages/Upload.tsx` — CSV file picker with drag area, PapaParse parsing, preview table (first 20 rows), submit button
- `src/client/pages/Person.tsx` — Contact/emergency/PCP info cards, assessment trend chart (Recharts LineChart), escalation table, call history table, "Call Now" button
- `src/client/pages/Calls.tsx` — All calls table with type/status/duration/summary/recording/date
- `src/client/pages/Escalations.tsx` — Filter tabs (pending/acknowledged/resolved/all), escalation table with tier badges, acknowledge/resolve action buttons

### Step 7: Twilio Integration — DONE
- `src/server/lib/twilio.ts` — Twilio client wrapper, `initiateCall()` function that creates Twilio call with voice/status/recording webhooks, updates DB on success/failure
- TwiML, status, recording routes already in Step 4

### Step 8: WebSocket + Claude Voice Protocol — DONE
- `src/server/lib/claude.ts` — Anthropic SDK setup, full `CALL_SYSTEM_PROMPT` (all 6 phases from research/02-CALL-PROTOCOL.md), `ASSESSMENT_TOOL` schema for tool use
- `src/server/ws/protocol.ts` — Session management (create/get/delete), `getGreeting()`, `processUtterance()` (sends to Claude, handles tool_use for assessment submission), `handleAssessmentSubmission()` (inserts assessment, updates call/person, creates escalations)
- `src/server/ws/handler.ts` — Bun WebSocket handler for ConversationRelay protocol (setup, prompt, interrupt, dtmf messages)

### Step 9: Background Jobs — DONE
- `src/server/jobs/boss.ts` — pg-boss init, `startWorkers()` registers 3 workers + 1 cron schedule
- `src/server/jobs/scheduler.ts` — Finds active persons not called in 7+ days, creates call records, queues `process-call` jobs
- `src/server/jobs/call-processor.ts` — Loads call + person, calls `initiateCall()` from twilio.ts
- `src/server/jobs/post-call.ts` — Re-scores assessment, updates person flag, creates escalations

### Step 10: Scoring & Escalation Logic — DONE
- `src/server/lib/scoring.ts` — Full `scoreAssessment()` function covering:
  - C-SSRS (immediate/urgent escalation based on result level)
  - PHQ-2 (>= 3 → routine escalation)
  - Ottawa 3DY (<= 2 → urgent, 3 → routine)
  - CLOVA 5 metrics (any <= 2 → routine escalation)
  - Tele-Free-Cog (< 15 → urgent/red, < 20 → routine/yellow)
  - STEADI (>= 4 → routine)
  - UCLA-3 (>= 7 → routine high isolation, >= 6 → routine)
  - Lawton IADL (<= 5 → routine)
  - Returns computed flag (green/yellow/red) + array of escalation entries
- `src/server/lib/escalation.ts` — `createEscalation()` inserts to DB, logs immediate tier urgently

### Step 11: Polish — DONE (partial)
- Toast notifications via sonner (wired into Upload, Escalations, Person pages)
- Loading states (Spinner component used on all list pages)
- Empty states on all tables
- Trend charts on Person detail (Recharts LineChart with CLOVA 5 metrics)
- Error handling in API client + all pages

---

## Build Verification

- **TypeScript:** `bunx tsc --noEmit` — **zero errors**
- **Vite build:** `bun run build:client` — **builds clean** (657KB JS, 18KB CSS)
- **Server startup:** Not yet tested end-to-end (requires DATABASE_URL)

---

## What's NOT Done / Still Pending

### Track A (Code) — Remaining Items

1. **Server startup test** — Haven't run `bun run dev` end-to-end yet (needs DATABASE_URL env var or will crash on pg-boss connect)

2. **Database push** — `bunx drizzle-kit push` not run yet (needs Neon connection string)

3. **Auth (better-auth)** — Not implemented. No `src/server/routes/auth.ts`, no login page, no session middleware on API routes. The architecture doc mentions it but it was deprioritized for hackathon speed.

4. **shadcn/ui CLI init** — Did NOT run `bunx shadcn@latest init`. Instead built components by hand in `src/client/components/ui.tsx`. This works fine but means we don't have the shadcn component registry wired up for `bunx shadcn@latest add ...`.

5. **Vite dev proxy** — `vite.config.ts` has proxy for `/api` → `localhost:3000`, but hasn't been tested with both servers running.

6. **Call trigger wiring** — The "Call Now" button creates a call record in DB but doesn't actually queue a pg-boss job yet (has a TODO comment in `src/server/routes/calls.ts:31`).

7. **WS session cleanup** — No mapping from WebSocket connection to callSid for cleanup on disconnect.

8. **Twilio ConversationRelay URL** — The TwiML voice endpoint uses `ws://` (derived from BASE_URL). In production needs `wss://`. Also needs the `<Parameter>` nested element for passing personId, which isn't in the current TwiML output.

9. **Recording playback** — Calls page has a "Play" link for recordings but no audio player component.

10. **Docs quality** — The 8 docs in `docs/` are summaries, not full documentation. They were fetched via WebFetch which returns condensed versions. For actual reference during development, should either use the doc sites directly or get fuller copies.

11. **Hackathon page links** — Could not extract links from cerebralvalley.ai (React Server Components, not scrapable). User may want to paste specific links for markdown conversion.

### Track B (Manual) — All Pending (User's responsibility)

- [ ] Logo design
- [ ] Domain + DNS
- [ ] Social accounts (Twitter/X)
- [ ] Railway deploy (create project, configure service, set env vars)
- [ ] Twilio setup (account, phone number, SID + Auth Token)
- [ ] Neon DB (create project, get connection string)
- [ ] Set env vars in `.env` file locally

---

## File Count & Lines

- **Source files:** 32 files in `src/`
- **Total lines of code:** ~4,967
- **Config files:** 4 (tsconfig, vite, drizzle, package.json)
- **Doc files:** 9 in `docs/`
- **Git status:** All new code is uncommitted

---

## Quick Start (once env vars are set)

```bash
# Copy env and fill in values
cp .env.example .env

# Push schema to Neon
bunx drizzle-kit push

# Terminal 1: API server
bun run dev

# Terminal 2: Vite dev server
bun run dev:vite

# Open http://localhost:5173
```

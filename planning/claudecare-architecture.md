# claudecare — Architecture & Setup Guide

## Overview

AI-powered check-in calls for isolated seniors. Structured screening, longitudinal cognitive tracking, and human-in-the-loop escalation — the AI surfaces signal, people make decisions. Built for Claude Code Hackathon.

**Stack:** Hono + Bun + Vite React SPA + Drizzle ORM + PostgreSQL (Neon) + pg-boss + Twilio + Claude (Opus 4.6)

**Key design choice:** Everything runs in **one process** — HTTP, WebSocket, and background jobs. One deploy. No cache hacks between services.

---

## Why This Stack

### Why NOT TanStack Start / Next.js
- No native WebSocket support → would require a separate WS server
- No background jobs → would require a separate worker process
- Results in 3 services to deploy and keep in sync
- SSR is unnecessary for an authenticated dashboard

### Why Hono + Bun
- **Native WebSocket** via `Bun.serve()` — same port as HTTP
- **One process** runs API, WebSocket relay, and pg-boss workers
- Hono is tiny (~14KB), fast, and has great middleware (CORS, auth, static files)
- Large community, excellent docs, works everywhere (Bun, Deno, Node, Cloudflare)
- Familiar REST-style routing (no magic server functions)

### Why keep Drizzle ORM
- Type-safe queries with autocomplete on column names and typed returns
- Schema-as-code: define tables in `.ts`, run `drizzle-kit push` to sync to Neon
- Automatic `camelCase` ↔ `snake_case` mapping
- You already know it — no learning curve
- Lightweight (~30KB), not a heavy ORM like Prisma

### Why Vite React SPA (no SSR)
- This is an authenticated dashboard — no public content to SEO-index
- SPA is simpler: Vite builds static files, Hono serves them
- shadcn/ui works the same way
- No hydration bugs, no server/client boundary confusion

---

## Architecture

```
one Bun process (Bun.serve)
├── Hono HTTP server ─── API routes (auth, persons, calls, assessments, escalations)
│                    └── Twilio webhooks (voice, status, recording)
│                    └── Serves React SPA static files
├── Bun WebSocket ────── Twilio ConversationRelay handler
│                    └── Claude Opus 4.6 voice protocol
├── pg-boss workers ──── call-scheduler (cron: daily call batches)
│                    └── call-processor (initiate Twilio call)
│                    └── post-call (transcribe → score → flag → escalate)
└── Drizzle ORM ──────── Neon serverless PostgreSQL
```

### One deploy target
- **Local:** `bun run dev`
- **Production:** Single Railway service, single Dockerfile

---

## Project Structure

```
claudecare/
├── src/
│   ├── server/
│   │   ├── index.ts              ← Entry point: Hono + Bun.serve (HTTP + WS)
│   │   ├── routes/
│   │   │   ├── auth.ts           ← better-auth routes
│   │   │   ├── persons.ts        ← CRUD: upload CSV, list, update
│   │   │   ├── calls.ts          ← call history, trigger manual call
│   │   │   ├── assessments.ts    ← scores, trends, flags
│   │   │   ├── escalations.ts    ← list, acknowledge, resolve
│   │   │   └── twilio/
│   │   │       ├── voice.ts      ← TwiML endpoint
│   │   │       ├── status.ts     ← call-status webhook
│   │   │       └── recording.ts  ← recording-status webhook
│   │   ├── ws/
│   │   │   ├── handler.ts        ← ConversationRelay WS handler
│   │   │   └── protocol.ts       ← Call protocol (PHQ-2, Ottawa 3DY, branching)
│   │   ├── jobs/
│   │   │   ├── boss.ts           ← pg-boss init (in-process)
│   │   │   ├── scheduler.ts      ← Cron: schedule daily call batches
│   │   │   ├── call-processor.ts ← Initiate Twilio call
│   │   │   └── post-call.ts      ← Transcribe → score → flag → escalate
│   │   ├── lib/
│   │   │   ├── db.ts             ← Drizzle + postgres driver
│   │   │   ├── twilio.ts         ← Twilio client
│   │   │   ├── claude.ts         ← Anthropic SDK (Opus 4.6)
│   │   │   ├── scoring.ts        ← PHQ-2, Ottawa 3DY, STEADI, etc.
│   │   │   └── escalation.ts     ← Flag thresholds, notification logic
│   │   └── env.ts                ← Env validation (zod)
│   └── client/
│       ├── main.tsx              ← React entry
│       ├── App.tsx               ← react-router setup
│       ├── pages/
│       │   ├── Dashboard.tsx     ← Person list with green/yellow/red flags
│       │   ├── Person.tsx        ← Individual detail, trend charts
│       │   ├── Calls.tsx         ← Call history, play recordings
│       │   ├── Escalations.tsx   ← Pending escalations queue
│       │   └── Upload.tsx        ← CSV upload for onboarding
│       └── components/           ← shadcn/ui components
├── public/                       ← Static assets (favicon, etc.)
├── drizzle.config.ts             ← Drizzle Kit config (push to Neon)
├── package.json
├── tsconfig.json
├── vite.config.ts                ← React SPA build config
├── tailwind.config.ts
└── .env
```

---

## Step-by-Step Setup

### 1. Create the project

```bash
mkdir claudecare && cd claudecare
bun init -y
```

### 2. Install dependencies

```bash
# Server
bun add hono postgres drizzle-orm pg-boss @anthropic-ai/sdk twilio better-auth zod

# Dev (drizzle-kit for schema push)
bun add -d drizzle-kit

# Client (React)
bun add react react-dom react-router recharts sonner papaparse

# Dev (rest)
bun add -d typescript @types/bun vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

### 3. Set up TypeScript

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    },
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Set up Vite (client build only)

`vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "src/client",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
```

### 5. Set up package.json scripts

```json
{
  "name": "claudecare",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/server/index.ts",
    "dev:vite": "vite dev --config vite.config.ts",
    "build:client": "vite build --config vite.config.ts",
    "build": "bun run build:client",
    "start": "bun src/server/index.ts",
    "db:init": "bun run schema.sql"
  }
}
```

For dev, run both in separate terminals:
- `bun run dev` — server (API + WS + workers)
- `bun run dev:vite` — Vite dev server with HMR (proxied to Hono)

For production: `bun run build && bun run start`

### 6. Create the server entry point

`src/server/index.ts`:
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("/*", cors());

// --- API routes ---
// app.route("/api/auth", authRoutes);
// app.route("/api/persons", personRoutes);
// app.route("/api/calls", callRoutes);
// app.route("/api/twilio", twilioRoutes);
// app.route("/api/escalations", escalationRoutes);

// Health check
app.get("/api/health", (c) => c.json({ ok: true }));

// --- Serve React SPA (production) ---
app.use("/*", serveStatic({ root: "./dist/client" }));
app.get("/*", serveStatic({ path: "./dist/client/index.html" }));

// --- Start server with WebSocket ---
const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
  websocket: {
    open(ws) {
      console.log("[WS] Connection opened");
    },
    message(ws, msg) {
      // ConversationRelay messages from Twilio
      console.log("[WS] Message:", msg);
    },
    close(ws) {
      console.log("[WS] Connection closed");
    },
  },
});

console.log(`Server running on http://localhost:${server.port}`);

// --- Start pg-boss workers (same process) ---
// const boss = await getBoss();
// await boss.work("schedule-calls", schedulerHandler);
// await boss.work("process-call", callProcessorHandler);
// await boss.work("post-call", postCallHandler);
// console.log("Workers started");
```

### 7. Create the database

Create a Neon project, get the connection string, add to `.env`:

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

Schema is defined in TypeScript via Drizzle (see "DB Schema" section below). Push to Neon:

```bash
bunx drizzle-kit push
```

`drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/lib/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
```

### 8. Set up shadcn/ui

```bash
bunx shadcn@latest init
```

Pick: New York style, Zinc color, CSS variables. Then add components as needed:

```bash
bunx shadcn@latest add button card table input dialog badge
```

### 9. Set up ngrok (for Twilio webhooks in dev)

```bash
ngrok http 3000
```

Update `.env`:
```bash
BASE_URL=https://abc123.ngrok-free.app
```

### 10. Set up `.env`

```bash
# Server
PORT=3000
BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=your-secret

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Email (optional)
RESEND_API_KEY=re_...
```

---

## DB Schema (Drizzle)

`src/server/lib/schema.ts`:
```typescript
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const persons = pgTable("persons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  pcpName: text("pcp_name"),
  pcpPhone: text("pcp_phone"),
  notes: text("notes"),
  status: text("status").default("active"),       // active, paused, discharged
  flag: text("flag").default("green"),             // green, yellow, red
  lastCallAt: timestamp("last_call_at"),
  callCount: integer("call_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const calls = pgTable("calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  callType: text("call_type").notNull().default("weekly"),   // weekly, quarterly
  callSid: text("call_sid"),
  status: text("status").default("scheduled"),
  duration: integer("duration"),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  summary: text("summary"),                                  // Claude-generated summary
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  // CLOVA 5 metrics (1-5)
  meals: integer("meals"),
  sleep: integer("sleep"),
  health: integer("health"),
  social: integer("social"),
  mobility: integer("mobility"),
  // PHQ-2 (0-6)
  phq2Score: integer("phq2_score"),
  phq2TriggeredCssrs: boolean("phq2_triggered_cssrs").default(false),
  cssrsResult: text("cssrs_result"),
  // Ottawa 3DY (0-4)
  ottawaScore: integer("ottawa_score"),
  // Quarterly instruments
  teleFreeCogScore: integer("tele_free_cog_score"),
  steadiScore: integer("steadi_score"),
  uclaLonelinessScore: integer("ucla_loneliness_score"),
  lawtonIadlScore: integer("lawton_iadl_score"),
  // Computed
  flag: text("flag").default("green"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escalations = pgTable("escalations", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "cascade" }),
  callId: uuid("call_id").references(() => calls.id),
  tier: text("tier").notNull(),                    // immediate, urgent, routine
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("pending"),       // pending, acknowledged, resolved
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

`src/server/lib/db.ts`:
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const driver = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: driver, schema, casing: "snake_case" });
export { schema };
```

Query examples:
```typescript
import { db, schema } from "./lib/db";
import { eq, desc } from "drizzle-orm";

// List persons with flags
const persons = await db.select().from(schema.persons)
  .where(eq(schema.persons.status, "active"))
  .orderBy(desc(schema.persons.flag));

// Get assessment trend for a person
const trend = await db.select()
  .from(schema.assessments)
  .where(eq(schema.assessments.personId, personId))
  .orderBy(desc(schema.assessments.createdAt))
  .limit(12);
```

Push schema to Neon (no SQL files needed):
```bash
bunx drizzle-kit push
```

---

## Deployment (Railway)

One service:

- **Build:** `bun run build`
- **Start:** `bun src/server/index.ts`
- **Env vars:** Same as `.env`

That's it. No multi-service orchestration.

---

## What to Build First (Hackathon Order)

1. **Server skeleton** — Hono + health check + serve static ✅
2. **DB + schema** — Run SQL against Neon ✅
3. **Auth** — better-auth, login page
4. **CSV upload** — Parse CSV, insert persons
5. **Dashboard** — Person list with flags (mock data first)
6. **Twilio call** — Manual "call now" button, TwiML, basic WS handler
7. **Claude protocol** — System prompt with PHQ-2, Ottawa 3DY, CLOVA metrics
8. **Post-call scoring** — Transcribe, extract scores, compute flags
9. **Escalation logic** — Auto-create escalations from flags
10. **Trend charts** — Recharts line charts on Person detail page
11. **Polish** — Toast notifications, loading states, error handling

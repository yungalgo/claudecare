# Project Summary — Hackathon Conversation Rundown

## The Hackathon

Anthropic hackathon with three problem statements: (1) Build a Tool That Should Exist, (2) Break the Barriers, (3) Amplify Human Judgment. Judging: Demo 30%, Opus 4.6 Use 25%, Impact 25%, Depth & Execution 20%. Prizes up to $50K in API credits. Special prizes for "Most Creative Opus 4.6 Exploration" and "The Keep Thinking Prize" (depth/iteration).

---

## How We Got to the Idea

### Initial Brainstorm
Started with several directions: Discovery Anomaly Detector, Codebase Architect, Research Paper Adversary. User rejected these — felt they didn't align with Anthropic's mission of guiding AGI for humanity.

### User's Instinct
Two threads emerged: (1) helping domain experts who can't code build their own tools, and (2) something altruistic like checking on lonely people. User pushed back on the "Expert Forge" idea — Claude Code already does this, the product gap is thin.

### Model Capability Mapper Detour
Explored an idea around benchmarking models and mapping "what's newly possible" with each generation. Abandoned because: existing benchmarks already cover this, hard to demo compellingly, feels academic.

### Settled Direction
Committed to the altruistic angle — AI-powered check-in calls for isolated/vulnerable elderly people. User emphasized that Anthropic's team cares about human-in-the-loop design and ushering in AGI responsibly.

---

## Deep Research Phase

### Kahlon Study Deep Dive
Analyzed the landmark Kahlon et al. (2021) JAMA Psychiatry study (N=240, Meals on Wheels recipients, empathetic phone calls). **Honest assessment:**
- Real but modest effects: d=0.48 loneliness, d=0.31 depression, d=0.35 anxiety
- **One of two primary loneliness measures FAILED** (De Jong p=.06)
- No active control (just proved "talking > not talking")
- COVID timing inflated baselines
- No durability data — effects likely evaporated
- No replication
- Social networks didn't change (p=.37)
- Differential attrition 10:1
- **Conclusion: Promising pilot inflated by COVID and media. Not a reliable evidence base for our product.**

### Critical Reframe
User pushed hard: "Don't sugarcoat. Where's the real data? What actually works?" This led to the key insight:

**The HEAL-HOA trial (N=1,151, 3-arm RCT) proved that STRUCTURED interventions outperform empathetic befriending.** Simple nice calls performed WORST. Structure wins. This is the foundation of our product — an AI can deliver perfect structure every time.

### What the Research Actually Supports
1. **Structured phone calls save lives** — Cochrane review, 22 RCTs, N=9,222, NNT=27 for mortality
2. **Semi-structured calls find 1.75x more unmet needs** than unstructured (Minyo 2024)
3. **Automated cognitive screening by phone works** — 82-88% accuracy vs. clinician (multiple studies)
4. **AI chatbot can administer cognitive tests** — r=0.81 vs. psychologist, 88% agreement (TICS-M-AI 2025)
5. **IVR completion rates in elderly: 83-96%** — they pick up the phone and engage
6. **60% of dementia goes undiagnosed**, only 10% get screening in a given year
7. **CLOVA CareCall in South Korea already does AI calls** to 15,000 elderly households

---

## The Product

### What It Is
An AI voice agent (powered by Opus 4.6) that makes structured check-in calls to isolated elderly people, identifies unmet needs using validated screening instruments, monitors cognitive function over time, and escalates findings to humans (caregivers, PCPs, AAAs) who make all decisions.

### What Problem It Solves
- 14 million isolated seniors with unmet needs going undetected
- 7.4 million with undiagnosed cognitive impairment
- Zero systematic monitoring between annual doctor visits
- The human workforce to do this doesn't exist (need 87,500 FTEs, have essentially none at scale)
- Existing programs serve thousands; the gap is millions

### Why AI
- Structure beats empathy (HEAL-HOA, N=1,151) — AI delivers perfect structure
- 87,500 FTE workers needed to call 14M weekly — they don't exist
- 40-60% annual turnover in care workforce
- 2.5M on Meals on Wheels waitlists, 38 states have home care waiting lists
- CLOVA CareCall proves the model works at scale

### The Call Protocol
Built from three validated, published sources using ONLY free/public domain instruments:

**Weekly Call (5-8 min):**
1. Opening & wellness check
2. CLOVA CareCall 5 health metrics (meals, sleep, health, social contact, mobility)
3. PHQ-2 depression screen (2 questions, public domain) → C-SSRS suicide screen if positive (branching, free)
4. Needs assessment (food, medication, safety, living situation)
5. Ottawa 3DY rapid cognitive check (4 items, open use, embedded naturally)
6. Close with memory callback from previous call

**Quarterly Comprehensive (adds 10-15 min):**
- Tele-Free-Cog cognitive assessment (24-point, non-proprietary, AUC 0.94)
- STEADI fall risk (12 items, CDC, public domain)
- UCLA 3-Item Loneliness Scale (public domain)
- Lawton IADL functional assessment (public domain)

### Licensing Clarification
- **TICS: PAID** (PAR Inc, commercial license required)
- **T-MoCA: PAID** (MoCA Cognition, commercial license required)
- **Our protocol uses ONLY free instruments** — no licensing barriers

### Escalation
Three tiers: IMMEDIATE (988/911 — suicidal ideation with plan, medical emergency, abuse), URGENT (PCP + family within 24 hrs — acute cognitive change, fall with injury, missed calls), ROUTINE (care coordinator within 1-2 weeks — positive depression screen, high fall risk, declining cognition, isolation).

Escalation infrastructure already exists: 622 AAAs, 211 system, PCPs, Adult Protective Services, 988. The problem is nobody feeds signal into it at scale.

### Technical Architecture
- Web app: caregiver/AAA uploads CSV (name, phone, emergency contact)
- Call scheduler with configurable limits and retry logic
- Twilio for telephony (1 number for demo, scales to thousands)
- Opus 4.6 voice agent with protocol as system prompt + person-specific context
- Post-call: transcription → structured scoring → longitudinal comparison → flag assignment
- Dashboard: person list with green/yellow/red flags, trend charts, escalation notifications
- DB stores: persons, calls, assessments (per-question scores), quarterly assessments, escalations

### TAM
- ~15-18 million unique individuals (socially isolated + undiagnosed cognitive impairment, with overlap)
- Access via 622 AAAs (12M+ seniors/year), 5,000+ Meals on Wheels programs (2M served + 2.5M waitlisted), 211 system, PACE programs, home health agencies
- Realistic pilot: partner with one AAA, enroll ~5,000 from their client list

### Twilio Math
- Demo: 1 number, 5-10 calls, <$5
- 1,000 people: 15 numbers, ~143 calls/day, ~$50/day
- 100,000 people: 300 numbers, ~14,300 calls/day, ~$5,000/day
- Cost per person per month: ~$0.68

---

## Hackathon Fit

| Criterion (Weight) | How We Score |
|---|---|
| **Demo (30%)** | Show live call → show structured report → show 4-week trend → show escalation. Judges think about their own parents. Emotional + technical. |
| **Opus 4.6 Use (25%)** | Deep: runs structured clinical protocol conversationally, maintains personality + memory across calls, scores validated instruments, detects longitudinal cognitive trends, writes nuanced caregiver summaries, handles branching logic (PHQ-2 → C-SSRS). Not just "API call." |
| **Impact (25%)** | 14M isolated seniors. 60% of dementia undiagnosed. Existing workforce can't scale. CLOVA CareCall proves model works but doesn't exist in US. |
| **Depth (20%)** | Evidence-based protocol from published research. Free instruments only. Three-tier escalation. Longitudinal tracking. Clear product architecture. Shows real iteration and craft. |

### Problem Statement Fit
- **Primary: Problem Statement 3 (Amplify Human Judgment)** — AI screens at scale, humans make all decisions
- **Secondary: Problem Statement 2 (Break the Barriers)** — takes clinical screening locked behind workforce scarcity and puts it in everyone's hands

---

## Files Written

```
research/
  00-PROJECT-SUMMARY.md     — This file
  01-TAM-AND-MARKET.md      — TAM numbers, access channels, workforce gap, enrollment strategy
  02-CALL-PROTOCOL.md       — Complete call rubric with exact questions, scoring, escalation
  03-INFRASTRUCTURE-AND-SCALE.md — Twilio math, DB schema, system architecture, config
  04-EVIDENCE-BASE.md        — All primary study citations with exact findings
  05-HACKATHON-RULES.md      — Rules, problem statements, judging criteria, strategic notes
```

---

## Open Decisions

1. **Name** — Not yet decided. Candidates floated: Tender, Lucida, Beside, Notice, Porch Light, Sunlight
2. **Voice provider** — Twilio + Opus 4.6 direct? Or voice AI platform (Bland.ai, Vapi)?
3. **Demo strategy** — Pre-record "Dorothy" scenario? Or live call?
4. **T-MoCA licensing for production** — For hackathon, using free Tele-Free-Cog. For production, could pursue MoCA Cognition partnership.
5. **Speech biomarker analysis (Layer 3)** — Stretch goal. Cross-sectional evidence strong but prospective validation is weak (N=15). Nice-to-have, not core.

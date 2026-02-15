# Infrastructure, Scale Math & Technical Architecture

## Twilio Telephony Math

### Constraints
- One Twilio number handles 1 concurrent call
- Average call duration: 8 minutes (weekly) / 18 minutes (quarterly)
- Calls per number per hour: ~6 (at 8 min avg + 2 min buffer)
- Calls per number per day: ~48 (in an 8-hour calling window, 10 AM - 6 PM)
- Call attempts per person: up to 3 (if no answer)
- Expected answer rate: ~70-85% on first attempt (based on IVR studies)
- USA only

### Scale Table

| Scale | People | Calls/Day (weekly cadence) | Concurrent Needed | Twilio Numbers | Est. Daily Twilio Cost |
|---|---|---|---|---|---|
| **Demo** | 5-10 | 5-10 | 1 | 1 | ~$1 |
| **Pilot** | 100 | ~15 | 2-3 | 3 | ~$5 |
| **Small deployment** | 1,000 | ~143 | 10-15 | 15 | ~$50 |
| **Medium** | 10,000 | ~1,430 | 50-75 | 75 | ~$500 |
| **Large** | 100,000 | ~14,300 | 200-300 | 300 | ~$5,000 |
| **National** | 1,000,000 | ~143,000 | 2,000+ | 2,000+ | ~$50,000 |

### Twilio Cost Breakdown (estimated, USA)
- Phone number: $1.15/month each
- Outbound voice: ~$0.014/min
- Average 8-min call: ~$0.11/call
- With 1.5 attempts avg: ~$0.17/person/week
- Monthly per person: ~$0.68
- At 100,000 people: ~$68,000/month in Twilio costs

### For the Hackathon Demo
- 1 Twilio number
- 5-10 pre-configured test recipients
- Manual trigger from web UI OR scheduled batch
- Total cost: < $5

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                        │
│  Caregiver/AAA uploads CSV: name, phone, emergency contact│
│  Dashboard: person list, flag status, trend charts        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   CALL SCHEDULER                         │
│  - Reads enrollment database                             │
│  - Determines who needs a call today                     │
│  - Respects daily call limits (configurable)             │
│  - Manages retry logic (up to 3 attempts)                │
│  - Preferred time windows per person                     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   TWILIO VOICE                           │
│  - Outbound call initiated                               │
│  - Connects to AI voice agent                            │
│  - Records call audio (with consent)                     │
│  - Handles DTMF fallback for responses                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              OPUS 4.6 VOICE AGENT                        │
│  - System prompt with call protocol                      │
│  - Person-specific context (name, history, prev calls)   │
│  - Runs through protocol phases                          │
│  - Natural conversation with embedded screening          │
│  - Handles branching logic (PHQ-2 → C-SSRS if needed)   │
│  - Memory of previous calls for continuity               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              POST-CALL PROCESSING                        │
│                                                          │
│  Step 1: Transcription                                   │
│    - Full call transcript                                │
│                                                          │
│  Step 2: Structured Data Extraction (Opus 4.6)           │
│    - Parse each protocol question → structured response  │
│    - Score PHQ-2 (0-6)                                   │
│    - Score C-SSRS (if administered)                      │
│    - Score Ottawa 3DY (0-4)                              │
│    - Score each CareCall metric (positive/negative/unknown)│
│    - Flag any unmet needs mentioned                      │
│    - Extract medication adherence signals                │
│    - Note any fall mentions                              │
│                                                          │
│  Step 3: Longitudinal Comparison (Opus 4.6)              │
│    - Compare scores to person's baseline                 │
│    - Compare to prior 4 weeks of calls                   │
│    - Detect trends (declining orientation, increasing    │
│      isolation, mood changes)                            │
│    - Generate natural language summary                   │
│                                                          │
│  Step 4: Flag Assignment                                 │
│    - GREEN: All scores normal, no concerns               │
│    - YELLOW: One or more scores approaching threshold    │
│              OR negative trend detected                  │
│    - RED: Score exceeds escalation threshold             │
│           (with tier: IMMEDIATE / URGENT / ROUTINE)      │
│                                                          │
│  Step 5: Escalation (if RED)                             │
│    - IMMEDIATE: Auto-dial 988/911 + SMS to emergency     │
│      contact                                             │
│    - URGENT: SMS + email to caregiver/PCP within hours   │
│    - ROUTINE: Added to weekly report for care coordinator │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    DATABASE                               │
│                                                          │
│  persons                                                 │
│    - id, name, phone, emergency_contact_phone            │
│    - emergency_contact_name, emergency_contact_relation  │
│    - pcp_name, pcp_phone (optional)                      │
│    - enrollment_date, preferred_call_time                 │
│    - call_cadence (daily/weekly)                          │
│    - status (active/paused/discharged)                   │
│    - notes (caregiver-provided context)                  │
│                                                          │
│  calls                                                   │
│    - id, person_id, timestamp, duration_seconds          │
│    - status (completed/no_answer/voicemail/refused)      │
│    - call_type (weekly/quarterly/post_event)             │
│    - audio_url, transcript                               │
│    - attempt_number (1-3)                                │
│                                                          │
│  assessments                                             │
│    - id, call_id, person_id, timestamp                   │
│    - phq2_score (0-6)                                    │
│    - cssrs_triggered (bool)                              │
│    - cssrs_highest_positive (Q1-Q6 or null)              │
│    - ottawa_3dy_score (0-4)                              │
│    - meals_status (positive/negative/unknown)            │
│    - sleep_status (positive/negative/unknown)            │
│    - health_status (positive/negative/unknown)           │
│    - social_status (positive/negative/unknown)           │
│    - mobility_status (positive/negative/unknown)         │
│    - fall_reported (bool)                                │
│    - medication_concern (bool)                           │
│    - food_insecurity (bool)                              │
│    - safety_concern (bool)                               │
│    - unmet_needs (text array)                            │
│    - overall_flag (green/yellow/red)                     │
│    - escalation_tier (null/immediate/urgent/routine)     │
│    - ai_summary (text — natural language summary)        │
│    - ai_trend_notes (text — longitudinal observations)   │
│                                                          │
│  quarterly_assessments                                   │
│    - id, call_id, person_id, timestamp                   │
│    - tele_freecog_score (0-24)                           │
│    - tele_freecog_subscores (JSON)                       │
│    - steadi_score (0-14)                                 │
│    - steadi_responses (JSON — each of 12 items)          │
│    - ucla3_score (3-9)                                   │
│    - lawton_iadl_score (0-7)                             │
│    - lawton_iadl_responses (JSON — each domain)          │
│                                                          │
│  escalations                                             │
│    - id, person_id, call_id, assessment_id               │
│    - tier (immediate/urgent/routine)                     │
│    - reason (text)                                       │
│    - contacted_who (text)                                │
│    - contacted_at (timestamp)                            │
│    - resolved (bool)                                     │
│    - resolution_notes (text)                             │
└─────────────────────────────────────────────────────────┘
```

## Configuration (for hackathon demo)

```yaml
# config.yaml
twilio:
  account_sid: "ACXXXXXXXXX"
  auth_token: "XXXXXXXXX"
  phone_numbers:
    - "+1XXXXXXXXXX"  # 1 number for demo
  max_concurrent_calls: 1
  max_calls_per_day: 10
  retry_attempts: 3
  retry_interval_minutes: 15

calling:
  call_window_start: "10:00"  # AM local time
  call_window_end: "18:00"    # PM local time
  max_call_duration_seconds: 900  # 15 min hard cap
  default_cadence: "weekly"

ai:
  model: "claude-opus-4-6"
  temperature: 0.7  # warm but not hallucinating

escalation:
  immediate_contacts:
    crisis_line: "988"
    emergency: "911"
  urgent_notification_method: "sms"  # sms, email, or both
  routine_report_frequency: "weekly"

country: "US"
```

## Answer Rate Expectations

| Metric | Expected Range | Source |
|---|---|---|
| First-attempt answer rate | 57-70% | Ottawa HF IVR; TREND cognitive study |
| After 3 attempts | 83-90% | Piette IVR studies (1,000+ elderly) |
| Call completion (of answered) | 87-96% | CDC falls IVR (96.4%); TREND (87-100%) |
| Sustained engagement (12 weeks) | 56-70% | Ottawa HF IVR (43.6% no-contact at week 12) |
| Elderly preference for phone vs. mail/email | Phone: 80%, Mail: 34%, Email: 24% | Post-surgical follow-up comparison study |

## Legal / Compliance Considerations

### FCC / TCPA
- AI-generated calls fall under TCPA (FCC ruling February 2024)
- Requires **prior express consent** from the call recipient
- Consent can be obtained verbally on first call (after human introduction)
- Must disclose that calls use AI technology
- Must provide opt-out mechanism

### HIPAA
- Call recordings and health data are PHI (Protected Health Information)
- Requires BAA (Business Associate Agreement) with Twilio
- Results shared with family only with patient authorization OR legal healthcare proxy
- De-identified aggregate data can be used for research

### Medicare Billing Pathway (future, not for hackathon)
- CPT 99483: Cognitive assessment and care plan services (~$260-282)
- Telehealth eligible (including audio-only with modifier 93)
- Once every 180 days per physician
- Requires oversight by qualified professional
- Audio-only policy landscape is unstable — may narrow
- No billing pathway for fully automated AI delivery currently exists

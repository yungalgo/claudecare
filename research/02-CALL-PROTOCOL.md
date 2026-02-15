# Call Protocol — Evidence-Based Rubric

## Licensing Status of All Instruments Used

**Every instrument in this protocol is FREE for commercial use. No licensing fees or negotiations required.**

| Instrument | Domain | License Status | Source |
|---|---|---|---|
| Tele-Free-Cog | Cognitive screening | Non-proprietary by design | Leung et al. 2021, University of Manchester |
| PHQ-2 | Depression | Public domain | Kroenke et al. 2003 |
| C-SSRS Screener | Suicide risk | Free (Columbia Lighthouse Project) | Posner et al. 2011 |
| STEADI Stay Independent | Fall risk | Public domain (CDC) | CDC STEADI Program |
| UCLA 3-Item | Loneliness | Public domain | Hughes et al. 2004 |
| Lawton IADL | Functional status | Public domain | Lawton & Brody 1969 |
| Ottawa 3DY | Rapid cognitive screen | Open use, no copyright | Molnar et al. 2009 |
| Short Blessed Test | Cognitive screen | No confirmed copyright holder | LOINC investigation |

### Instruments we CANNOT use (paid/licensed)
| Instrument | Owner | Cost |
|---|---|---|
| TICS | PAR, Inc. | $165 kit + commercial license |
| T-MoCA / MoCA-Blind | MoCA Cognition Inc. | $125 certification + negotiated commercial license |
| Mini-Cog | Soo Borson, MD | Commercial license required |
| MIS-T | Einstein College of Medicine | Commercial license required |
| MMAS-4 | Morisky | Commercial license required via moriskyscale.com |
| 6CIT | Kingshill Research Centre | Written permission required |
| GPCOG | UNSW / Brodaty | Non-commercial terms |

---

## Call Cadence (Evidence-Based)

| Period | Frequency | Call Type | Duration |
|---|---|---|---|
| Week 1-2 (onboarding) | Every other day | Brief wellness + baseline | 3-5 min |
| Week 3+ (ongoing) | Weekly | Full routine check-in | 5-8 min |
| Every 3 months | Replaces one weekly call | Comprehensive assessment | 15-20 min |
| Post-event (fall, hospitalization) | Daily for 1-2 weeks | Enhanced monitoring | 5-8 min |

Evidence:
- Weekly is the most-supported frequency for sustained engagement (BRI Care Consultation, AAA programs)
- CLOVA CareCall uses twice-weekly with ~1.5-3 min calls (15,000 households)
- IVR completion rates: 83-90% across 1,000+ elderly (Piette studies)
- Engagement drops over time: "no contact" increased from 30.5% to 43.6% over 12 weeks (Ottawa HF IVR study)
- Elderly prefer late morning (10-11 AM) or early evening (6-8 PM) call times
- Make up to 3 attempts per scheduled call before marking as missed

---

## WEEKLY ROUTINE CHECK-IN (5-8 minutes)

### Based on: CLOVA CareCall 5-metric structure + AHRQ RED Toolkit + validated screening instruments

---

### Phase 1 — Opening & Wellness Check (30-60 seconds)

```
"Hello [Name], this is [System Name] calling for your weekly check-in.
How are you doing today?"
```

**What we're assessing:** General orientation, speech coherence, mood from tone
**What we record:** Response time, speech clarity, emotional tone (baseline comparison)

---

### Phase 2 — CareCall 5 Health Metrics (90-120 seconds)

Source: CLOVA CareCall protocol (Naver, deployed across 70+ municipalities in South Korea, ~15,000 households). Each metric classified as Positive/Negative/Unknown.

#### 2a. Meals
```
"Have you been eating regularly? What did you have for [breakfast/lunch] today?"
```
Flags: Skipping meals, can't remember what they ate, mentioning not having food

#### 2b. Sleep
```
"How have you been sleeping? Any trouble falling asleep or staying asleep?"
```
Flags: Significant insomnia, hypersomnia, change from baseline

#### 2c. General Health
```
"How are you feeling physically? Any new aches, pains, or health concerns?"
```
Flags: New symptoms, worsening chronic conditions, mentions of ER/hospital

#### 2d. Going Out / Social Contact
```
"Have you been able to get out of the house this week? Have you had any visitors
or talked to anyone?"
```
Flags: Increasing isolation, inability to leave house, mentions of loneliness

#### 2e. Exercise / Mobility
```
"Have you been able to move around okay? Any trouble walking or getting around?"
```
Flags: New mobility issues, mentions of falls or near-falls

---

### Phase 3 — PHQ-2 Depression Screen (30-60 seconds)

Source: Kroenke et al. 2003. PUBLIC DOMAIN. Sensitivity 83%, specificity 92% for major depression.

```
"I'd like to ask you two quick questions about how you've been feeling.

Over the last two weeks, how often have you been bothered by
having little interest or pleasure in doing things?
Would you say not at all, several days, more than half the days,
or nearly every day?"
```
Score: 0 = not at all, 1 = several days, 2 = more than half the days, 3 = nearly every day

```
"And over the last two weeks, how often have you been bothered by
feeling down, depressed, or hopeless?
Not at all, several days, more than half the days, or nearly every day?"
```
Score: Same 0-3 scale

**Total score range: 0-6. Cutoff: >= 3 is positive screen.**

If PHQ-2 >= 3 → Proceed to C-SSRS

---

### Phase 3a — C-SSRS Suicide Safety Screen (if PHQ-2 >= 3)

Source: Columbia Lighthouse Project. FREE. Branching logic.

```
Q1: "I'd like to ask a couple more questions to make sure you're doing okay.
In the past month, have you wished you were dead, or wished you could
go to sleep and not wake up?"
```
If NO → skip to Q6

If YES:
```
Q2: "Have you actually had any thoughts of killing yourself?"
```
If NO → skip to Q6

If YES:
```
Q3: "Have you been thinking about how you might do this?"
```
```
Q4: "Have you had these thoughts and had some intention of acting on them?"
```
```
Q5: "Have you started to work out or worked out the details of how to kill
yourself? Do you intend to carry out this plan?"
```

```
Q6: "Have you ever done anything, started to do anything, or prepared to do
anything to end your life?"
```

**Escalation:**
- YES to Q1 or Q2 only → URGENT: Referral to behavioral health within 24 hours
- YES to Q3, Q4, or Q5 → IMMEDIATE: Transfer to 988 Suicide & Crisis Lifeline
- YES to Q6 → IMMEDIATE: Safety assessment, contact emergency services

---

### Phase 4 — Needs Assessment (60-90 seconds)

Source: AHRQ RED Toolkit structure + semi-structured call RCT (Minyo et al. 2024, Benjamin Rose Institute — found 1.75x more unmet needs with structured vs unstructured calls)

```
"Do you have enough food and supplies at home right now?"
```
```
"Have you been able to take all your medications as prescribed?
Are you having any trouble getting refills?"
```
```
"Is there anything you need help with around the house that
you haven't been able to get?"
```
```
"Do you feel safe at home?"
```

Flags: Food insecurity → refer to Meals on Wheels/AAA. Medication issues → refer to PCP/pharmacist. Safety concern → probe gently, if abuse suspected → Adult Protective Services.

---

### Phase 5 — Orientation Quick-Check (30 seconds)

Source: Ottawa 3DY (Molnar et al. 2009). OPEN USE / NO COPYRIGHT. Validated rapid cognitive screen.

Embedded naturally at close of call:

```
"Just to wrap up — can you remind me what day of the week it is today?"
"And what's today's date?"
"What year are we in?"
```

Plus one additional item (DLROW — "WORLD" spelled backwards):
```
"One more quick thing — can you spell the word WORLD backwards for me?"
```

**Scoring: 1 point each for day, date, DLROW, year. Total 0-4. Any errors → flag for quarterly comprehensive screen.**

This is NOT a full cognitive assessment. It's a weekly rapid check that detects acute changes (delirium, sudden decline) between quarterly comprehensive screens.

---

### Phase 6 — Close (30 seconds)

```
"Is there anything else on your mind, or anything you'd like to talk about?"
```
```
"We'll call again [next scheduled day/time]. If you need anything before then,
you can call [number]. Have a good [day/evening], [Name]."
```

**Memory feature (following CareCall precedent):** Reference something from the previous call.
Example: "Last week you mentioned your tomatoes were coming in — how are they doing?"

---

## QUARTERLY COMPREHENSIVE ASSESSMENT (adds 10-15 min)

Includes everything in weekly call, PLUS the following additional modules:

### Module A — Tele-Free-Cog Cognitive Assessment (5-10 minutes)

Source: Leung et al. 2021. NON-PROPRIETARY. Validated in 960 patients. AUC 0.94 for dementia vs controls.

The Tele-Free-Cog is the telephone-adapted version of the Free-Cog, which was explicitly created as a non-proprietary alternative to the MoCA/MMSE. The telephone version drops 3 visual/motor items, yielding a 24-point scale.

**Domains tested:**
- Orientation (date, day, month, year, season, place, city) — 7 points
- Attention (serial 7s from 100) — 5 points
- Memory registration (3 words) — 0 points (used for delayed recall)
- Verbal fluency (animals in 60 seconds) — scored by count
- Memory recall (3 words after delay) — 3 points
- Similarities/abstraction — 2 points
- Sentence repetition — 2 points
- Additional language/executive items — remaining points

**Cutoffs (from validation study):**
- >= 20/24: Normal
- 15-19/24: Possible MCI → refer to PCP for comprehensive evaluation
- < 15/24: Possible dementia → urgent referral to PCP + notify family

**Longitudinal use:**
- Drop of 3+ points from prior quarterly score → flag as acute change (possible delirium) → same-day PCP notification
- Gradual downward trend over 2+ quarters → flag for clinical review

**Where to get it:** University of Manchester: https://documents.manchester.ac.uk/display.aspx?DocID=55485
Also: https://eatspeakthink.com/online-assessment-cognition/

### Module B — STEADI Fall Risk Screen (2-3 minutes)

Source: CDC STEADI Program. PUBLIC DOMAIN. All 12 items published.

```
Please answer yes or no to each of the following:

1. "I have fallen in the past year." (2 points)
2. "I use or have been advised to use a cane or walker to get around safely." (2 pts)
3. "Sometimes I feel unsteady when I am walking." (1 point)
4. "I steady myself by holding onto furniture when walking at home." (1 point)
5. "I am worried about falling." (1 point)
6. "I need to push with my hands to stand up from a chair." (1 point)
7. "I have some trouble stepping up onto a curb." (1 point)
8. "I often have to rush to the toilet." (1 point)
9. "I have lost some feeling in my feet." (1 point)
10. "I take medicine that sometimes makes me feel light-headed or more tired
    than usual." (1 point)
11. "I take medicine to help me sleep or improve my mood." (1 point)
12. "I often feel sad or depressed." (1 point)
```

**Score range: 0-14. Cutoff: >= 4 = high fall risk → refer to PCP.**

### Module C — UCLA 3-Item Loneliness Scale (1 minute)

Source: Hughes et al. 2004. PUBLIC DOMAIN. Developed specifically for telephone surveys.

```
"I'm going to read three statements. For each one, please tell me
whether you feel that way hardly ever, some of the time, or often.

1. How often do you feel that you lack companionship?
   Hardly ever, some of the time, or often?"

2. "How often do you feel left out?"

3. "How often do you feel isolated from others?"
```

**Scoring:** Hardly ever = 1, Some of the time = 2, Often = 3
**Range: 3-9. Score >= 6 → flag for social services referral. Score 7-9 → high isolation.**

### Module D — Lawton IADL Functional Assessment (2-3 minutes)

Source: Lawton & Brody 1969. PUBLIC DOMAIN.

Focus on change detection — compare to prior quarter:

```
"I'd like to ask about some everyday activities.

Can you use the telephone without help?"
"Can you get to places beyond walking distance on your own?"
"Can you do your own grocery shopping?"
"Can you prepare your own meals?"
"Can you do your housework?"
"Can you manage your own medications?"
"Can you handle your own money and bills?"
```

**Scoring:** 1 = independent, 0 = needs help, for each domain. Range 0-7.
**Flag: Loss of 2+ IADLs from prior assessment → notify caregiver, refer to PCP.**

---

## ESCALATION PROTOCOL

### Three-Tier System

| Tier | Timeline | Triggers | Action |
|---|---|---|---|
| **IMMEDIATE** | Minutes | C-SSRS Q3-5 positive; medical emergency reported; elder abuse suspected | Transfer to 988/911. Contact emergency contact. |
| **URGENT** | Within 24 hours | C-SSRS Q1-2 positive; acute cognitive change (3+ pt drop); fall with injury; 2+ consecutive missed calls | Notify PCP + family/caregiver. Schedule follow-up within 24 hours. |
| **ROUTINE** | Within 1-2 weeks | PHQ-2 >= 3; STEADI >= 4; Tele-Free-Cog below cutoff; UCLA-3 >= 6; IADL decline; nutrition concerns; medication non-adherence | Generate report to care coordinator. Refer to appropriate service. |

### Escalation Contacts

| Concern | Primary Contact | Secondary | Tertiary |
|---|---|---|---|
| Suicidal ideation/behavior | 988 Suicide & Crisis Lifeline / 911 | Emergency contact | PCP |
| Medical emergency | 911 | Emergency contact | PCP |
| Elder abuse | Adult Protective Services (APS) | 911 | Family (if not perpetrator) |
| Acute cognitive change | PCP | Family/caregiver | Neurologist |
| Depression | PCP | Behavioral health provider | Care coordinator |
| Fall risk / recent fall | PCP | Physical therapy | Family/caregiver |
| Medication issues | PCP / Pharmacist | Care coordinator | Family/caregiver |
| Functional decline | Care coordinator | PCP | Home health agency |
| Social isolation | Social worker / AAA | Senior services | Family |
| Missed calls (2+ consecutive) | Emergency contact / family | Non-emergency police (welfare check) | Care coordinator |
| Food insecurity | Meals on Wheels / AAA | 211 system | Family |

---

## EXISTING PROTOCOL SOURCES (for reference/validation)

| Resource | What It Is | Access |
|---|---|---|
| AHRQ RED Toolkit Phone Call Script | Most complete published call script (post-discharge) | https://www.ahrq.gov/patient-safety/settings/hospital/red/toolkit/redtool5.html |
| NY State Friendly Calls Volunteer Manual | 16-page manual with sample scripts | https://aging.ny.gov/system/files/documents/2022/03/friendly-calls-volunteer-manual-final.pdf |
| InterFaith Works Wellness Calls Toolkit | Scripts and worksheets for elderly calls | https://www.interfaithworkscny.org/wp-content/uploads/2020/04/Wellness-Calls-Toolkit.pdf |
| CLOVA CareCall Corpus | 10,500 generated dialogues (200 English) | https://github.com/naver-ai/carecall-corpus |
| CareCall Research Paper | System architecture and deployment data | https://clova.ai/en/tech-blog/en-clova-carecall-research-paper |
| CDC STEADI Full Protocol | Fall risk screening resources | https://www.cdc.gov/steadi/hcp/clinical-resources/index.html |
| Columbia C-SSRS | Suicide screening protocol | https://cssrs.columbia.edu/ |
| PHQ-2 / PHQ-9 | Depression screening | https://www.phqscreeners.com/ |
| Tele-Free-Cog | Non-proprietary cognitive assessment | https://documents.manchester.ac.uk/display.aspx?DocID=55485 |

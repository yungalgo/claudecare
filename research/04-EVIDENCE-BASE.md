# Evidence Base — Primary Sources

## Core Studies (Strongest Evidence)

### 1. Structured Phone Calls Improve Outcomes (Cochrane-Level)
**Study:** Inglis et al. (2015) "Structured telephone support or non-invasive telemonitoring for patients with heart failure"
**Type:** Cochrane Systematic Review — 22 RCTs, N=9,222
**Finding:** Structured telephone support reduced all-cause mortality (NNT=27) and heart-failure-related hospitalizations (NNT=14)
**Relevance:** Gold-standard evidence that structured phone calls save lives and reduce crises
**Source:** Cochrane Database of Systematic Reviews

### 2. Semi-Structured Calls Find More Unmet Needs
**Study:** Minyo et al. (2024) "Using Telephone Reassurance Calls to Screen for Unmet Needs"
**Type:** Pilot RCT, Benjamin Rose Institute on Aging
**Finding:** Semi-structured calls identified **1.75x more unmet needs**, generated **1.23x more service referrals**, and resulted in **1.39x more services used** compared to unstructured calls
**Relevance:** Direct evidence that structure in check-in calls produces better outcomes than "friendly chatting"
**Source:** Innovation in Aging, 2024; 8(Supplement_1):84

### 3. Structured Behavioral Activation Outperforms Befriending
**Study:** HEAL-HOA Trial (2024-2025)
**Type:** 3-arm RCT, N=1,151 older adults, Hong Kong
**Arms:** Telephone behavioral activation (Tele-BA) vs. telephone mindfulness (Tele-MF) vs. telephone befriending (Tele-BF)
**Finding:** Tele-BA significantly outperformed befriending on loneliness at 6 and 12 months. Befriending (empathetic calls without structure) performed worst.
**Relevance:** Proves structure > empathy alone. An AI delivering structured protocol would outperform unstructured human volunteers.
**Source:** JAMA Network Open (2024); 12-month results in PMC (2025)

### 4. IVR Automated Calls Are Feasible for Elderly
**Study:** Cochrane Review — Automated telephone communication systems (ATCS)
**Type:** Systematic review, 132 trials, 4+ million contacts
**Finding:** ATCS can change health behaviors and improve clinical outcomes. Completion rates of 83-90% in elderly populations.
**Source:** Cochrane Database Syst Rev. 2019;9(9):CD009921

### 5. Automated Cognitive Screening by Phone Is Valid
**Study:** TICS-M-AI (2025) — AI chatbot administers TICS-M
**Type:** Validation study, N=264, four sub-studies
**Finding:** r=0.81 correlation with psychologist-administered version, 88% classification agreement, kappa=0.73. 6% distress rate (same as human administration).
**Relevance:** Direct proof that AI can administer cognitive screening by phone with clinical-grade accuracy.
**Source:** Journal of Clinical and Experimental Neuropsychology (2025); doi:10.1080/13803395.2025.2542248

### 6. TREND System — Longitudinal Automated Cognitive Monitoring
**Study:** Mundt et al. (2007) "Telephonic Remote Evaluation of Neuropsychological Deficits"
**Type:** Longitudinal validation, N=107, 24 weeks
**Finding:** IVR cognitive testing at home produced significant group differences between normal, MCI, and mild dementia. Completion rates: 100% (normal), 99.2% (MCI), 87.3% (mild dementia).
**Relevance:** Proves automated telephone cognitive monitoring over time is feasible, even for people with dementia.
**Source:** PubMed: 17804954

### 7. IVR Cognitive Screening Achieves Clinical Accuracy
**Study:** Mundt et al. (2001) — Computer-automated dementia screening
**Type:** Validation study, N=155
**Finding:** Sensitivity 82.0%, specificity 85.5% for dementia detection via automated telephone
**Source:** Archives of Internal Medicine (now JAMA Internal Medicine)

### 8. Dementia Is Massively Under-Diagnosed
**Study:** Chen et al. (2024) "Correlates of Missed or Late Dementia Diagnosis"
**Type:** Cohort study, N=710
**Finding:** Only 54% received a timely diagnosis. Black participants had 2.15x higher odds of diagnostic delay.
**Additional:** Bradford & Kunik systematic review found up to 2/3 of dementia cases are misdiagnosed or delayed.
**Sources:** Alzheimer's & Dementia (2024); Alzheimer Disease & Associated Disorders (PMC2787842)

### 9. Only 10% of Seniors Get Cognitive Screening
**Study:** Multiple sources on Medicare AWV cognitive assessment rates
**Finding:** Only ~32% of Medicare beneficiaries had an AWV by 2018. Of those, only ~31% got formal cognitive testing. Net: ~10% of seniors receive structured cognitive assessment in any given year. 60.7% of dementia cases undetected.
**Sources:** PMC9517732; USC Schaeffer Center

### 10. Tele-Free-Cog Validation
**Study:** Leung et al. (2021) "Free-Cog: A brief cognitive assessment"
**Type:** Validation study, N=960
**Finding:** AUC 0.94 for dementia vs. normal controls. Non-proprietary, copyright-free by design.
**Relevance:** Our chosen cognitive screening instrument. Validated, free, phone-suitable.
**Source:** International Journal of Geriatric Psychiatry; University of Manchester

---

## Supporting Evidence

### Speech Biomarkers for Cognitive Decline
| Study | N | Finding | Source |
|---|---|---|---|
| Snowdon (Nun Study), 1996 | 678 nuns | Idea density in writing predicted Alzheimer's 58 years later with 80-90% accuracy | PubMed: 8606473 |
| DementiaBank ADReSS Challenge | 156 | Best accuracy: 89.8% for AD detection from speech | Springer 2024 |
| Framingham Heart Study, 2024 | 200 | Non-semantic acoustic features alone detect MCI | JMIR Aging 2024 |
| Novoic AMYPRED, 2022 | 133 | Speech predicted amyloid positivity AUC 0.77; reduced incorrect referrals by 59% | Brain Communications |
| Winterlight Labs | 101 | Global coherence showed longitudinal change when MoCA/ADAS-Cog didn't | PMC8579012 |
| Yamada et al., 2020 | 15 | Repetition across daily phone calls detected AD (proof of concept) | JMIR Mental Health |
| ki:elements SB-C | Multiple cohorts | MCI detection AUC 0.81 in unseen validation | PMC9710455 |

**Assessment:** Cross-sectional evidence for speech biomarkers is moderate-to-strong. Prospective longitudinal validation from natural conversation is very weak (essentially only Yamada 2020, N=15). This is a stretch goal, not a core feature.

### Existing AI Precedent
| System | Deployment | Scale | Call Structure |
|---|---|---|---|
| CLOVA CareCall (Naver, South Korea) | 70+ municipalities since 2021 | ~15,000 households | LLM-based, 2x/week, 5 health metrics, memory feature |
| ElliQ (Intuition Robotics) | NYSOFA pilot, 800+ seniors | Ongoing | Tablet-based companion, 30 interactions/day |
| MoCA Solo | In development | N/A | AI avatar administers MoCA on tablet |
| ki:elements | Clinical trials | Multiple cohorts | Automated phone calls with speech biomarker scoring |

### The Kahlon Study (For Context — NOT Our Evidence Base)
**Study:** Kahlon et al. (2021) — JAMA Psychiatry, N=240
**What it showed:** Empathetic phone calls from untrained 17-23 year olds to Meals on Wheels recipients during COVID reduced loneliness (d=0.48) and depression (d=0.31) vs. no-contact control.
**Why we DON'T rely on it:**
- No active control (just proved "talking > not talking")
- COVID timing inflated baselines
- One of two primary loneliness measures FAILED (De Jong p=.06)
- No follow-up after calls ended
- No replication
- Social network scores didn't change (p=.37)
- Differential attrition 10:1

**How we use it:** As context for the problem (isolated seniors benefit from contact) and as enrollment rate precedent (47% of approached enrolled). But our intervention is fundamentally different — structured screening, not empathetic chatting.

---

## Key Numbers for Presentations/Pitches

### The Problem
- 14 million socially isolated seniors (National Academies 2020)
- 7.4 million with undiagnosed MCI (Alzheimer's Assoc. 2024)
- 60% of dementia cases go undetected (Bradford & Kunik; Chen et al. 2024)
- Only 10% of seniors get cognitive screening in a given year (PMC9517732)
- Zero systematic monitoring between annual doctor visits
- 1,700 geriatric psychiatrists for 54 million seniors (1:32,000)
- 4.6 million care worker shortfall projected by 2032

### The Evidence That This Works
- Structured phone calls: NNT=27 for mortality, NNT=14 for hospitalization (Cochrane, 22 RCTs)
- Semi-structured calls find 1.75x more unmet needs (Minyo 2024)
- Automated phone cognitive screening: 82-88% accuracy vs. clinician (Mundt 2001; TICS-M-AI 2025)
- IVR completion in elderly: 83-96% (multiple studies)
- AI chatbot cognitive screening: r=0.81 vs psychologist, 88% agreement (TICS-M-AI 2025)
- Automated phone monitoring feasible for 24 weeks even in people with dementia (TREND, Mundt 2007)

### Why AI, Not Humans
- To call 14M seniors weekly: need 87,500 FTE workers (don't exist)
- 40-60% annual turnover in care workforce
- 2.5M seniors on Meals on Wheels waitlists
- 38 states have home care waiting lists (700K waiting)
- Structure beats empathy (HEAL-HOA, N=1,151) — AI delivers perfect structure every time
- CLOVA CareCall already serves 15,000 households via AI calls in South Korea

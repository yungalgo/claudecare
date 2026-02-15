# Total Addressable Market & Population Analysis

## Target Populations

### Slice 1: Socially Isolated Seniors
- **~14 million** Americans 65+ are socially isolated
- Source: National Academies of Sciences, Engineering, and Medicine (2020), *Social Isolation and Loneliness in Older Adults: Opportunities for the Health Care System*
- Definition: Objective lack of social relationships and infrequent social contact, measured via Lubben Social Network Scale (LSNS) or equivalent

### Slice 2: Undiagnosed Cognitive Impairment
- **~8 million** Americans have Mild Cognitive Impairment (MCI)
- Of those, only **~8% are diagnosed** → **~7.4 million undiagnosed**
- **~6.9 million** Americans have Alzheimer's or related dementias
- **~60% of dementia cases go undetected** → **~3.6 million undiagnosed dementia**
- Sources: Alzheimer's Association 2024 Facts & Figures; Amjad et al. (2018) JGIM; USC/Emory diagnostic rate studies

### Overlap & Total TAM
- Social isolation is a documented risk factor for cognitive decline (Livingston et al., Lancet 2020)
- Cognitive decline causes social withdrawal (circular relationship)
- Conservative estimate of unique individuals: **~15-18 million** who are either socially isolated, have undiagnosed cognitive impairment, or both
- This is the total addressable market

### Key Context Numbers
| Metric | Number | Source |
|---|---|---|
| Americans 65+ | 54 million | US Census 2023 |
| Seniors living alone | 16 million | US Census 2023 |
| Socially isolated seniors (25% of 65+) | ~14 million | National Academies 2020 |
| Seniors with MCI (undiagnosed) | ~7.4 million | Alzheimer's Assoc. 2024 |
| Seniors with undiagnosed dementia | ~3.6 million | Amjad et al. 2018 |
| Family caregivers | 63 million | AARP 2025 |
| Long-distance caregivers (1+ hr away) | 7-9 million | AARP |
| Geriatric psychiatrists in US | 1,700 | Board certification data |
| Projected care worker shortfall by 2032 | 4.6 million | Harvard School of Public Health |

## Serviceable Addressable Market (SAM)

### Reachable through existing channels
| Channel | Organizations | People Served/Year | Enrollment Feasibility |
|---|---|---|---|
| Area Agencies on Aging | 622 | 12M+ seniors | High — actively seeking tech partnerships |
| Meals on Wheels | 5,000+ local programs | 2M seniors + 2.5M waitlisted | High — have recipient contact info |
| 211 System | ~200 call centers | 16.8M requests/year (2024) | Medium — referral gateway |
| PACE Programs | 185 orgs, 300+ centers | ~90,500 participants | High — most vulnerable population |
| Senior Centers | 11,000+ | 1M/day | Medium — misses homebound |
| Home Health Agencies | 11,353 CMS-certified | 4.5-4.9M patients/year | Medium — can refer isolated patients |
| Medicare AWV | Via PCPs | ~47-67% of beneficiaries | Medium — PCP referral at annual visit |

### Realistic Initial Penetration
- Kahlon study enrollment rate: 47% of those approached (240/510)
- If we partner with 10 AAAs covering ~200,000 seniors → approach ~10,000 → enroll ~4,700
- If we partner with 50 Meals on Wheels programs covering ~20,000 recipients → approach ~20,000 → enroll ~9,400
- **Conservative Year 1 target: 10,000-15,000 enrolled participants**

## The Workforce Gap (Why AI Is Necessary)

### The math doesn't work with humans
- To call 1 million isolated seniors weekly at 10 min/call + 5 min documentation:
  - = 250,000 hours/week
  - = 6,250 full-time workers (40 hr/week)
- For 14 million isolated seniors: **87,500 full-time workers**
- These workers do not exist. Current programs serve thousands, not millions.

### Documented evidence of insufficient workforce
| Fact | Source |
|---|---|
| Meals on Wheels has 2.5M seniors on waitlists | Meals on Wheels America 2025 Benchmarking Report |
| 38 states have waiting lists for home care (700K waiting) | KFF |
| Age UK takes "several weeks" to match one befriender | Age UK website |
| 40-60% annual turnover in home care | Industry data |
| 4.6M care worker shortfall projected by 2032 | Harvard School of Public Health |
| Geriatric psychiatrist ratio: 1:32,000 seniors | Board certification data |
| 70% of elderly with anxiety/depression get no treatment | CDC MMWR |
| Age UK explicitly excludes people with memory loss/dementia | Age UK befriending services page |

### What exists today
- Telephone reassurance programs: Tiny, fragmented, no national registry, serve thousands
- Maryland Senior Call Check: Automated safety check only (answer or welfare check dispatched)
- YANA (sheriff programs): Safety verification only, not health assessment
- Meals on Wheels friendly calling: Per-program, volunteer-dependent, no standardized protocol
- CLOVA CareCall (South Korea): AI-powered, serves ~15,000 households across 70+ municipalities — closest existing precedent

## Access Strategy

### Primary channel: Area Agencies on Aging (AAAs)
- National directory: USAging.org (formerly n4a)
- Headquarters: 1100 New Jersey Ave SE, Suite 350, Washington, DC 20003
- Phone: (202) 872-0888
- 622 AAAs nationwide, each covering a designated Planning and Service Area
- They maintain client databases (NAPIS/OAAPS)
- Precedent for tech partnerships: NYSOFA + Intuition Robotics (ElliQ), CDW + Thrive Center, AARP AgeTech Collaborative
- Barriers: misaligned goals, financing infrastructure, ROI demonstration, IT platform compatibility (The Gerontologist, 2022)

### Secondary channel: Meals on Wheels
- 5,000+ local programs
- Already perform wellness checks during meal delivery
- Many run volunteer calling programs
- Data held locally by each program (not centralized)
- Partnership requires program-by-program agreements

### Referral gateway: Eldercare Locator
- Federal service: 1-800-677-1116
- Website: eldercare.acl.gov
- 400,000 requests/year
- Operated by USAging, funded by Administration for Community Living

### Enrollment flow
1. Partner with AAA or Meals on Wheels program
2. They identify eligible participants from existing client lists
3. Caregiver/family member OR participant self-enrolls
4. Verbal consent obtained on first call (per Kahlon study precedent)
5. Emergency contact registered
6. Calls begin per scheduled cadence

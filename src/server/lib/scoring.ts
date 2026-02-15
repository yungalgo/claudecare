interface AssessmentInput {
  meals: number | null;
  sleep: number | null;
  health: number | null;
  social: number | null;
  mobility: number | null;
  phq2Score: number | null;
  phq2TriggeredCssrs: boolean | null;
  cssrsResult: string | null;
  ottawaScore: number | null;
  teleFreeCogScore: number | null;
  steadiScore: number | null;
  uclaLonelinessScore: number | null;
  lawtonIadlScore: number | null;
}

interface EscalationEntry {
  tier: string; // immediate, urgent, routine
  reason: string;
  details: string;
}

interface ScoreResult {
  flag: string; // green, yellow, red
  escalations: EscalationEntry[];
}

export function scoreAssessment(a: AssessmentInput): ScoreResult {
  const escalations: EscalationEntry[] = [];
  let flag = "green";

  // --- C-SSRS (highest priority) ---
  if (a.cssrsResult) {
    switch (a.cssrsResult) {
      case "plan":
      case "intent":
        flag = "red";
        escalations.push({
          tier: "immediate",
          reason: "C-SSRS: Active suicidal ideation with plan/intent",
          details: `C-SSRS result: ${a.cssrsResult}. Immediate safety assessment required. Contact 988/911.`,
        });
        break;
      case "prior_attempt":
        flag = "red";
        escalations.push({
          tier: "immediate",
          reason: "C-SSRS: Prior suicide attempt disclosed",
          details: `C-SSRS result: prior_attempt. Immediate safety assessment required.`,
        });
        break;
      case "active_ideation":
        flag = "red";
        escalations.push({
          tier: "urgent",
          reason: "C-SSRS: Active suicidal ideation",
          details: `C-SSRS result: active_ideation. Referral to behavioral health within 24 hours.`,
        });
        break;
      case "passive_ideation":
        flag = flag === "green" ? "yellow" : flag;
        escalations.push({
          tier: "urgent",
          reason: "C-SSRS: Passive suicidal ideation",
          details: `C-SSRS result: passive_ideation. Referral to behavioral health within 24 hours.`,
        });
        break;
    }
  }

  // --- PHQ-2 Depression Screen ---
  // Score 0-6, cutoff >= 3 is positive
  if (a.phq2Score !== null && a.phq2Score >= 3) {
    flag = flag === "green" ? "yellow" : flag;
    escalations.push({
      tier: "routine",
      reason: "PHQ-2 positive screen",
      details: `PHQ-2 score: ${a.phq2Score}/6 (cutoff: 3). Refer to PCP for full PHQ-9.`,
    });
  }

  // --- Ottawa 3DY Cognitive Quick-Check ---
  // Score 0-4, any errors flag for quarterly comprehensive screen
  if (a.ottawaScore !== null && a.ottawaScore < 4) {
    if (a.ottawaScore <= 2) {
      flag = flag !== "red" ? "yellow" : flag;
      escalations.push({
        tier: "urgent",
        reason: "Ottawa 3DY: Possible acute cognitive change",
        details: `Ottawa 3DY score: ${a.ottawaScore}/4. Multiple errors suggest possible delirium or acute change. Same-day PCP notification recommended.`,
      });
    } else {
      escalations.push({
        tier: "routine",
        reason: "Ottawa 3DY: Minor cognitive errors",
        details: `Ottawa 3DY score: ${a.ottawaScore}/4. Flag for quarterly comprehensive screen.`,
      });
    }
  }

  // --- CLOVA 5 Metrics (1-5 each) ---
  const metrics = [
    { name: "Meals", value: a.meals, concern: "Nutrition concern" },
    { name: "Sleep", value: a.sleep, concern: "Sleep disturbance" },
    { name: "Health", value: a.health, concern: "Health concern" },
    { name: "Social", value: a.social, concern: "Social isolation" },
    { name: "Mobility", value: a.mobility, concern: "Mobility concern" },
  ];

  for (const m of metrics) {
    if (m.value !== null && m.value <= 2) {
      flag = flag === "green" ? "yellow" : flag;
      escalations.push({
        tier: "routine",
        reason: `Low ${m.name} score: ${m.concern}`,
        details: `${m.name} rated ${m.value}/5. ${m.concern} flagged for care coordinator review.`,
      });
    }
  }

  // --- Quarterly: Tele-Free-Cog (0-24) ---
  if (a.teleFreeCogScore !== null) {
    if (a.teleFreeCogScore < 15) {
      flag = "red";
      escalations.push({
        tier: "urgent",
        reason: "Tele-Free-Cog: Possible dementia",
        details: `Tele-Free-Cog score: ${a.teleFreeCogScore}/24 (cutoff: 15 for dementia). Urgent referral to PCP + notify family.`,
      });
    } else if (a.teleFreeCogScore < 20) {
      flag = flag === "green" ? "yellow" : flag;
      escalations.push({
        tier: "routine",
        reason: "Tele-Free-Cog: Possible MCI",
        details: `Tele-Free-Cog score: ${a.teleFreeCogScore}/24 (cutoff: 20 for MCI). Refer to PCP for comprehensive evaluation.`,
      });
    }
  }

  // --- Quarterly: STEADI Fall Risk (0-14) ---
  if (a.steadiScore !== null && a.steadiScore >= 4) {
    flag = flag === "green" ? "yellow" : flag;
    escalations.push({
      tier: "routine",
      reason: "STEADI: High fall risk",
      details: `STEADI score: ${a.steadiScore}/14 (cutoff: 4). Refer to PCP for fall risk assessment.`,
    });
  }

  // --- Quarterly: UCLA-3 Loneliness (3-9) ---
  if (a.uclaLonelinessScore !== null) {
    if (a.uclaLonelinessScore >= 7) {
      flag = flag === "green" ? "yellow" : flag;
      escalations.push({
        tier: "routine",
        reason: "UCLA-3: High isolation",
        details: `UCLA-3 score: ${a.uclaLonelinessScore}/9 (high isolation). Refer to social services.`,
      });
    } else if (a.uclaLonelinessScore >= 6) {
      escalations.push({
        tier: "routine",
        reason: "UCLA-3: Moderate loneliness",
        details: `UCLA-3 score: ${a.uclaLonelinessScore}/9. Flag for social services referral.`,
      });
    }
  }

  // --- Quarterly: Lawton IADL (0-7) ---
  if (a.lawtonIadlScore !== null && a.lawtonIadlScore <= 5) {
    flag = flag === "green" ? "yellow" : flag;
    escalations.push({
      tier: "routine",
      reason: "Lawton IADL: Functional decline",
      details: `Lawton IADL score: ${a.lawtonIadlScore}/7. Loss of 2+ IADLs indicates functional decline. Notify caregiver, refer to PCP.`,
    });
  }

  return { flag, escalations };
}

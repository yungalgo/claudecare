import { describe, test, expect } from "bun:test";
import { scoreAssessment } from "./scoring.ts";

// Helper: green baseline (all scores healthy)
function greenBaseline() {
  return {
    meals: 5,
    sleep: 5,
    health: 5,
    social: 5,
    mobility: 5,
    phq2Score: 0,
    phq2TriggeredCssrs: false,
    cssrsResult: null,
    ottawaScore: 4,
    teleFreeCogScore: null,
    steadiScore: null,
    uclaLonelinessScore: null,
    lawtonIadlScore: null,
  };
}

describe("scoreAssessment", () => {
  // --- Green flag (healthy) ---

  test("all healthy scores → green flag, no escalations", () => {
    const result = scoreAssessment(greenBaseline());
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  test("all null scores → green flag, no escalations", () => {
    const result = scoreAssessment({
      meals: null, sleep: null, health: null, social: null, mobility: null,
      phq2Score: null, phq2TriggeredCssrs: null, cssrsResult: null,
      ottawaScore: null, teleFreeCogScore: null, steadiScore: null,
      uclaLonelinessScore: null, lawtonIadlScore: null,
    });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- C-SSRS (highest priority) ---

  test("C-SSRS plan → red flag, immediate escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "plan" });
    expect(result.flag).toBe("red");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.tier).toBe("immediate");
    expect(result.escalations[0]!.reason).toContain("plan/intent");
  });

  test("C-SSRS intent → red flag, immediate escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "intent" });
    expect(result.flag).toBe("red");
    expect(result.escalations[0]!.tier).toBe("immediate");
  });

  test("C-SSRS prior_attempt → red flag, immediate escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "prior_attempt" });
    expect(result.flag).toBe("red");
    expect(result.escalations[0]!.tier).toBe("immediate");
  });

  test("C-SSRS active_ideation → red flag, urgent escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "active_ideation" });
    expect(result.flag).toBe("red");
    expect(result.escalations[0]!.tier).toBe("urgent");
  });

  test("C-SSRS passive_ideation → yellow flag, urgent escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "passive_ideation" });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.tier).toBe("urgent");
  });

  test("C-SSRS none → no escalation from C-SSRS", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "none" });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- PHQ-2 ---

  test("PHQ-2 score 3 → yellow flag, routine escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), phq2Score: 3 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.tier).toBe("routine");
    expect(result.escalations[0]!.reason).toContain("PHQ-2");
  });

  test("PHQ-2 score 6 → yellow flag, routine escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), phq2Score: 6 });
    expect(result.flag).toBe("yellow");
  });

  test("PHQ-2 score 2 → green flag, no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), phq2Score: 2 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- Ottawa 3DY ---

  test("Ottawa score 4 (perfect) → green flag, no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), ottawaScore: 4 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  test("Ottawa score 3 → routine escalation (flag for quarterly)", () => {
    const result = scoreAssessment({ ...greenBaseline(), ottawaScore: 3 });
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.tier).toBe("routine");
    // Flag stays green since score 3 only adds routine escalation without changing flag
    // (unless other conditions apply)
  });

  test("Ottawa score 2 → yellow flag, urgent escalation (acute cognitive change)", () => {
    const result = scoreAssessment({ ...greenBaseline(), ottawaScore: 2 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.tier).toBe("urgent");
    expect(result.escalations[0]!.reason).toContain("acute cognitive change");
  });

  test("Ottawa score 0 → yellow flag, urgent escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), ottawaScore: 0 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.tier).toBe("urgent");
  });

  // --- CLOVA-5 Metrics ---

  test("single low CLOVA metric (meals=2) → yellow flag, routine escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), meals: 2 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.reason).toContain("Meals");
  });

  test("single low CLOVA metric (sleep=1) → yellow flag", () => {
    const result = scoreAssessment({ ...greenBaseline(), sleep: 1 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.reason).toContain("Sleep");
  });

  test("CLOVA metric at 3 → no escalation (threshold is ≤2)", () => {
    const result = scoreAssessment({ ...greenBaseline(), social: 3 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  test("multiple low CLOVA metrics → yellow flag, multiple escalations", () => {
    const result = scoreAssessment({ ...greenBaseline(), meals: 1, sleep: 2, mobility: 1 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations).toHaveLength(3);
    expect(result.escalations.every((e) => e.tier === "routine")).toBe(true);
  });

  // --- Quarterly: Tele-Free-Cog ---

  test("Tele-Free-Cog < 15 → red flag, urgent escalation (possible dementia)", () => {
    const result = scoreAssessment({ ...greenBaseline(), teleFreeCogScore: 12 });
    expect(result.flag).toBe("red");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.tier).toBe("urgent");
    expect(result.escalations[0]!.reason).toContain("dementia");
  });

  test("Tele-Free-Cog 15-19 → yellow flag, routine escalation (possible MCI)", () => {
    const result = scoreAssessment({ ...greenBaseline(), teleFreeCogScore: 17 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.tier).toBe("routine");
    expect(result.escalations[0]!.reason).toContain("MCI");
  });

  test("Tele-Free-Cog ≥ 20 → no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), teleFreeCogScore: 22 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- Quarterly: STEADI ---

  test("STEADI ≥ 4 → yellow flag, routine escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), steadiScore: 5 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.reason).toContain("STEADI");
  });

  test("STEADI < 4 → no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), steadiScore: 3 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- Quarterly: UCLA-3 ---

  test("UCLA-3 ≥ 7 → yellow flag, routine escalation (high isolation)", () => {
    const result = scoreAssessment({ ...greenBaseline(), uclaLonelinessScore: 8 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.reason).toContain("High isolation");
  });

  test("UCLA-3 = 6 → routine escalation (moderate loneliness), no flag change", () => {
    const result = scoreAssessment({ ...greenBaseline(), uclaLonelinessScore: 6 });
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0]!.reason).toContain("Moderate loneliness");
  });

  test("UCLA-3 ≤ 5 → no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), uclaLonelinessScore: 5 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- Quarterly: Lawton IADL ---

  test("Lawton IADL ≤ 5 → yellow flag, routine escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), lawtonIadlScore: 4 });
    expect(result.flag).toBe("yellow");
    expect(result.escalations[0]!.reason).toContain("Lawton IADL");
  });

  test("Lawton IADL > 5 → no escalation", () => {
    const result = scoreAssessment({ ...greenBaseline(), lawtonIadlScore: 7 });
    expect(result.flag).toBe("green");
    expect(result.escalations).toHaveLength(0);
  });

  // --- Priority ordering ---

  test("C-SSRS red overrides PHQ-2 yellow", () => {
    const result = scoreAssessment({
      ...greenBaseline(),
      cssrsResult: "active_ideation",
      phq2Score: 4,
    });
    expect(result.flag).toBe("red");
    // Should have both escalations
    expect(result.escalations.length).toBeGreaterThanOrEqual(2);
  });

  test("C-SSRS red is not downgraded by other green scores", () => {
    const result = scoreAssessment({ ...greenBaseline(), cssrsResult: "plan" });
    expect(result.flag).toBe("red");
  });

  test("multiple yellow conditions don't produce red", () => {
    const result = scoreAssessment({
      ...greenBaseline(),
      phq2Score: 5,
      ottawaScore: 2,
      meals: 1,
      sleep: 1,
    });
    expect(result.flag).toBe("yellow");
    expect(result.escalations.length).toBeGreaterThanOrEqual(4);
  });

  test("passive_ideation stays yellow even with low CLOVA scores", () => {
    const result = scoreAssessment({
      ...greenBaseline(),
      cssrsResult: "passive_ideation",
      meals: 2,
    });
    expect(result.flag).toBe("yellow");
  });

  // --- Edge cases ---

  test("Tele-Free-Cog red overrides passive_ideation yellow", () => {
    const result = scoreAssessment({
      ...greenBaseline(),
      cssrsResult: "passive_ideation",
      teleFreeCogScore: 10,
    });
    expect(result.flag).toBe("red");
  });

  test("all worst-case scores → red flag, many escalations", () => {
    const result = scoreAssessment({
      meals: 1,
      sleep: 1,
      health: 1,
      social: 1,
      mobility: 1,
      phq2Score: 6,
      phq2TriggeredCssrs: true,
      cssrsResult: "plan",
      ottawaScore: 0,
      teleFreeCogScore: 5,
      steadiScore: 14,
      uclaLonelinessScore: 9,
      lawtonIadlScore: 0,
    });
    expect(result.flag).toBe("red");
    // C-SSRS(1) + PHQ-2(1) + Ottawa(1) + 5 CLOVA(5) + TFC(1) + STEADI(1) + UCLA(1) + Lawton(1) = 12
    expect(result.escalations.length).toBeGreaterThanOrEqual(10);
  });
});

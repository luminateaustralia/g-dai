import { describe, expect, it } from "vitest";

import { computeAggregates, type ObservationInput } from "../engine";

function obs(
  metricKey: string,
  timePoint: ObservationInput["timePoint"],
  numericValue: number | null,
  cohortId: string | null = null,
  isMissing = false
): ObservationInput {
  return { metricKey, timePoint, numericValue, cohortId, isMissing };
}

describe("computeAggregates", () => {
  it("averages by metric and time point and computes change from baseline", () => {
    const observations: ObservationInput[] = [
      obs("life_overall", "baseline", 4),
      obs("life_overall", "baseline", 6),
      obs("life_overall", "3mo", 6),
      obs("life_overall", "3mo", 8),
      obs("life_overall", "6mo", 8),
      obs("life_overall", "6mo", 10),
    ];

    const result = computeAggregates(observations);
    const baseline = result.find(
      (r) => r.metricKey === "life_overall" && r.timePoint === "baseline"
    );
    const sixMo = result.find(
      (r) => r.metricKey === "life_overall" && r.timePoint === "6mo"
    );

    expect(baseline?.avgValue).toBe(5);
    expect(baseline?.nCount).toBe(2);
    expect(sixMo?.avgValue).toBe(9);
    expect(sixMo?.changeFromBaseline).toBe(4);
  });

  it("excludes missing responses and counts them", () => {
    const observations: ObservationInput[] = [
      obs("life_overall", "baseline", 6),
      obs("life_overall", "baseline", null, null, true),
    ];
    const baseline = computeAggregates(observations).find(
      (r) => r.metricKey === "life_overall" && r.timePoint === "baseline"
    );
    expect(baseline?.avgValue).toBe(6);
    expect(baseline?.nCount).toBe(1);
    expect(baseline?.missingCount).toBe(1);
  });

  it("includes numeric zero in the average (e.g. dash normalised to 0)", () => {
    const observations: ObservationInput[] = [
      obs("career_confidence", "baseline", 6),
      obs("career_confidence", "baseline", 0),
    ];
    const baseline = computeAggregates(observations).find(
      (r) => r.metricKey === "career_confidence" && r.timePoint === "baseline"
    );
    expect(baseline?.avgValue).toBe(3);
    expect(baseline?.nCount).toBe(2);
  });

  it("excludes out-of-range values from the average", () => {
    const observations: ObservationInput[] = [
      obs("life_overall", "baseline", 6),
      obs("life_overall", "baseline", 99),
    ];
    const baseline = computeAggregates(observations).find(
      (r) => r.metricKey === "life_overall" && r.timePoint === "baseline"
    );
    expect(baseline?.avgValue).toBe(6);
    expect(baseline?.nCount).toBe(1);
  });

  it("produces per-cohort aggregates", () => {
    const observations: ObservationInput[] = [
      obs("life_overall", "baseline", 4, "c1"),
      obs("life_overall", "baseline", 8, "c2"),
    ];
    const result = computeAggregates(observations);
    const c1 = result.find(
      (r) =>
        r.metricKey === "life_overall" &&
        r.timePoint === "baseline" &&
        r.cohortId === "c1"
    );
    const overall = result.find(
      (r) =>
        r.metricKey === "life_overall" &&
        r.timePoint === "baseline" &&
        r.cohortId === null
    );
    expect(c1?.avgValue).toBe(4);
    expect(overall?.avgValue).toBe(6);
  });
});

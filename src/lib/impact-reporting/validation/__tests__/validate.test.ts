import { describe, expect, it } from "vitest";

import { validateObservations } from "../validate";
import type { ParsedObservation } from "@/lib/impact-reporting/importers/pwi-tracker";

function obs(
  partial: Partial<ParsedObservation> & {
    metricKey: string;
    timePoint: ParsedObservation["timePoint"];
  }
): ParsedObservation {
  return {
    intakeNumber: "1",
    clientName: null,
    cohortName: null,
    rawValue: null,
    numericValue: null,
    isMissing: false,
    ...partial,
  };
}

describe("validateObservations", () => {
  it("flags an error when there are no clients", () => {
    const result = validateObservations([], 0);
    expect(result.canGenerate).toBe(false);
    expect(result.issues.some((i) => i.code === "no_clients")).toBe(true);
  });

  it("does not flag dash-as-zero (0) on 0–10 metrics as invalid", () => {
    const result = validateObservations(
      [
        obs({
          metricKey: "career_confidence",
          timePoint: "baseline",
          numericValue: 0,
          rawValue: "-",
        }),
      ],
      1
    );
    expect(result.summary.invalidCount).toBe(0);
    expect(result.issues.some((i) => i.code === "out_of_range")).toBe(false);
  });

  it("flags out-of-range values as warnings but still allows generation", () => {
    const result = validateObservations(
      [obs({ metricKey: "life_overall", timePoint: "baseline", numericValue: 99 })],
      1
    );
    expect(result.canGenerate).toBe(true);
    expect(result.summary.invalidCount).toBe(1);
    expect(result.issues.some((i) => i.code === "out_of_range")).toBe(true);
  });

  it("counts missing values and reports them", () => {
    const result = validateObservations(
      [
        obs({
          metricKey: "financial_worry",
          timePoint: "baseline",
          isMissing: true,
        }),
        obs({
          metricKey: "life_overall",
          timePoint: "baseline",
          numericValue: 7,
        }),
      ],
      1
    );
    expect(result.summary.missingCount).toBe(1);
    expect(result.issues.some((i) => i.code === "missing_excluded")).toBe(true);
  });

  it("warns when no baseline data is present", () => {
    const result = validateObservations(
      [obs({ metricKey: "life_overall", timePoint: "3mo", numericValue: 7 })],
      1
    );
    expect(result.issues.some((i) => i.code === "no_baseline")).toBe(true);
  });
});

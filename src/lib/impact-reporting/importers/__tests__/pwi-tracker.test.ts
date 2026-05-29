import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parsePwiWorkbook } from "../pwi-tracker";

// Builds a workbook mirroring the Data Entry layout: five header rows, then one
// data row per client. Each metric occupies three columns (baseline/3mo/6mo)
// starting at column D (index 3).
function buildWorkbook() {
  const header = Array.from({ length: 45 }, (_, i) => `h${i}`);
  const filler = () => header.slice();

  function dataRow(
    intake: string,
    name: string,
    cohort: string,
    values: Record<number, [number | string, number | string, number | string]>
  ) {
    const row: (string | number | null)[] = new Array(45).fill(null);
    row[0] = intake;
    row[1] = name;
    row[2] = cohort;
    for (const [metricIndex, triple] of Object.entries(values)) {
      const base = 3 + Number(metricIndex) * 3;
      row[base] = triple[0];
      row[base + 1] = triple[1];
      row[base + 2] = triple[2];
    }
    return row;
  }

  const aoa: (string | number | null)[][] = [
    filler(),
    filler(),
    filler(),
    filler(),
    filler(),
    // life_overall = metric 0, financial_worry = metric 8
    dataRow("101", "Client A", "Cohort X", {
      0: [4, 6, 8],
      8: [2, 3, 4],
    }),
    dataRow("102", "Client B", "Cohort X", {
      0: [6, 8, 10],
      8: [5, 4, 4], // baseline 5 = "Don't know" -> missing
    }),
    // career_confidence = 12, work_readiness = 11
    dataRow("103", "Client C", "Cohort X", {
      0: ["", 6, 8],
      11: ["-", 3, 4],
      12: ["-", 5, 6],
    }),
  ];

  const dataSheet = XLSX.utils.aoa_to_sheet(aoa);
  const intakeSheet = XLSX.utils.aoa_to_sheet([
    ["Intake No", "Name", "Completed Program"],
    [101, "Client A", "Yes"],
    [102, "Client B", "No"],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, "Data Entry");
  XLSX.utils.book_append_sheet(wb, intakeSheet, "Intakes");
  return wb;
}

describe("parsePwiWorkbook", () => {
  const parsed = parsePwiWorkbook(buildWorkbook());

  it("parses one observation per client x metric x time point", () => {
    expect(parsed.clientCount).toBe(3);
    // 3 clients x 14 metrics x 3 time points
    expect(parsed.observations.length).toBe(3 * 14 * 3);
  });

  it("maps positional columns to the correct metrics and time points", () => {
    const lifeBaselineA = parsed.observations.find(
      (o) =>
        o.intakeNumber === "101" &&
        o.metricKey === "life_overall" &&
        o.timePoint === "baseline"
    );
    expect(lifeBaselineA?.numericValue).toBe(4);
    expect(lifeBaselineA?.isMissing).toBe(false);
  });

  it("treats 'Don't know' (financial worry = 5) as missing", () => {
    const fwBaselineB = parsed.observations.find(
      (o) =>
        o.intakeNumber === "102" &&
        o.metricKey === "financial_worry" &&
        o.timePoint === "baseline"
    );
    expect(fwBaselineB?.isMissing).toBe(true);
    expect(fwBaselineB?.numericValue).toBeNull();
  });

  it("treats '-' as 0 on 0–10 metrics (e.g. career confidence)", () => {
    const careerBaseline = parsed.observations.find(
      (o) =>
        o.intakeNumber === "103" &&
        o.metricKey === "career_confidence" &&
        o.timePoint === "baseline"
    );
    expect(careerBaseline?.numericValue).toBe(0);
    expect(careerBaseline?.isMissing).toBe(false);
    expect(careerBaseline?.rawValue).toBe("-");
  });

  it("does not coerce '-' to 0 on 1–5 metrics (e.g. work readiness)", () => {
    const workBaseline = parsed.observations.find(
      (o) =>
        o.intakeNumber === "103" &&
        o.metricKey === "work_readiness" &&
        o.timePoint === "baseline"
    );
    expect(workBaseline?.numericValue).toBeNull();
    expect(workBaseline?.isMissing).toBe(false);
  });

  it("treats blank 0–10 cells as missing", () => {
    const lifeBaseline = parsed.observations.find(
      (o) =>
        o.intakeNumber === "103" &&
        o.metricKey === "life_overall" &&
        o.timePoint === "baseline"
    );
    expect(lifeBaseline?.isMissing).toBe(true);
    expect(lifeBaseline?.numericValue).toBeNull();
  });

  it("collects cohorts and intake outcomes", () => {
    expect(parsed.cohortNames).toContain("Cohort X");
    expect(parsed.intakes).toHaveLength(2);
    expect(parsed.intakes[0]?.completedProgram).toBe(true);
    expect(parsed.intakes[1]?.completedProgram).toBe(false);
  });
});

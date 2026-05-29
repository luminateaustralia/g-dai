import type * as XLSX from "xlsx";

import {
  asBoolean,
  asNumber,
  asString,
  findSheetName,
  pick,
  sheetMatrix,
  sheetRows,
} from "@/lib/ingestion/workbook";
import {
  METRIC_DEFINITIONS,
  type MetricDefinitionSeed,
} from "@/lib/impact-reporting/metrics/definitions";
import type { TimePoint } from "@/db/schema";

export type ParsedObservation = {
  intakeNumber: string;
  clientName: string | null;
  cohortName: string | null;
  metricKey: string;
  timePoint: TimePoint;
  rawValue: string | null;
  numericValue: number | null;
  isMissing: boolean;
};

export type ParsedIntake = {
  intakeNumber: string;
  name: string | null;
  cohort: string | null;
  completedProgram: boolean | null;
  employed: boolean | null;
  rawData: string;
};

export type ParsedPwiWorkbook = {
  observations: ParsedObservation[];
  intakes: ParsedIntake[];
  clientCount: number;
  cohortNames: string[];
  warnings: string[];
};

const TIME_POINT_ORDER: TimePoint[] = ["baseline", "3mo", "6mo"];

// Column layout of the "Data Entry" sheet (0-based):
// 0 = Intake #, 1 = Client Name, 2 = Cohort/Program, then each metric occupies
// three consecutive columns (Baseline, 3 Months, 6 Months) starting at column D.
const FIRST_METRIC_COLUMN = 3;
const DATA_START_ROW_INDEX = 5; // Row 6 in the spreadsheet.

/** Spreadsheet dash markers scored as 0 on 0–10 scales (per the Client Tracker Guide). */
const DASH_ZERO_MARKERS = new Set(["-", "–", "—"]);

export function isDashZero(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  return DASH_ZERO_MARKERS.has(String(raw).trim());
}

function parseMetricNumeric(
  metric: MetricDefinitionSeed,
  cell: unknown
): number | null {
  let numeric = asNumber(cell);
  if (metric.scaleType === "0-10" && isDashZero(cell)) {
    numeric = 0;
  }
  return numeric;
}

function isMissingValue(
  metric: MetricDefinitionSeed,
  raw: unknown,
  numeric: number | null
): boolean {
  if (raw === null || raw === undefined || raw === "") return true;
  const rawStr = String(raw).trim().toLowerCase();
  for (const mv of metric.missingValues) {
    if (String(mv).trim().toLowerCase() === rawStr) return true;
    if (numeric !== null && typeof mv === "number" && mv === numeric) {
      return true;
    }
  }
  return false;
}

export function parsePwiWorkbook(wb: XLSX.WorkBook): ParsedPwiWorkbook {
  const warnings: string[] = [];

  const dataSheet = findSheetName(wb, ["Data Entry"]);
  if (!dataSheet) {
    return {
      observations: [],
      intakes: [],
      clientCount: 0,
      cohortNames: [],
      warnings: ['Could not find a "Data Entry" sheet in the workbook.'],
    };
  }

  const matrix = sheetMatrix(wb, dataSheet);
  const observations: ParsedObservation[] = [];
  const cohortSet = new Set<string>();
  let clientCount = 0;

  for (let r = DATA_START_ROW_INDEX; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const intakeNumber = asString(row[0]);
    if (!intakeNumber) continue; // Skip blank / trailing rows.

    clientCount += 1;
    const clientName = asString(row[1]);
    const cohortName = asString(row[2]);
    if (cohortName) cohortSet.add(cohortName);

    METRIC_DEFINITIONS.forEach((metric, metricIndex) => {
      const baseCol = FIRST_METRIC_COLUMN + metricIndex * 3;
      TIME_POINT_ORDER.forEach((timePoint, offset) => {
        const cell = row[baseCol + offset] ?? null;
        const numeric = parseMetricNumeric(metric, cell);
        const missing = isMissingValue(metric, cell, numeric);
        observations.push({
          intakeNumber,
          clientName,
          cohortName,
          metricKey: metric.key,
          timePoint,
          rawValue: asString(cell),
          numericValue: missing ? null : numeric,
          isMissing: missing,
        });
      });
    });
  }

  if (clientCount === 0) {
    warnings.push("No client rows were found on the Data Entry sheet.");
  }

  const intakes = parseIntakes(wb, warnings);

  return {
    observations,
    intakes,
    clientCount,
    cohortNames: Array.from(cohortSet),
    warnings,
  };
}

function parseIntakes(wb: XLSX.WorkBook, warnings: string[]): ParsedIntake[] {
  const sheetName = findSheetName(wb, ["Intakes"]);
  if (!sheetName) {
    warnings.push('No "Intakes" sheet found; completion data was skipped.');
    return [];
  }

  const rows = sheetRows(wb, sheetName);
  const intakes: ParsedIntake[] = [];
  for (const row of rows) {
    const intakeNumber = asString(pick(row, "Intake No", "Intake #", "Intake"));
    if (!intakeNumber) continue;
    intakes.push({
      intakeNumber,
      name: asString(pick(row, "Name", "Client Name")),
      cohort: asString(pick(row, "Cohort", "Program", "Cohort / Program")),
      completedProgram: asBoolean(
        pick(row, "Completed Program", "Completed", "Program Complete")
      ),
      employed: asBoolean(
        pick(row, "Employed", "Employment", "Employment Status", "Working")
      ),
      rawData: JSON.stringify(row),
    });
  }
  return intakes;
}

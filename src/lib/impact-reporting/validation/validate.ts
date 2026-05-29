import {
  METRIC_DEFINITIONS,
  metricByKey,
} from "@/lib/impact-reporting/metrics/definitions";
import type {
  ParsedObservation,
  ParsedPwiWorkbook,
} from "@/lib/impact-reporting/importers/pwi-tracker";
import type { TimePoint } from "@/db/schema";

export type IssueLevel = "error" | "warning" | "info";

export type ValidationIssue = {
  level: IssueLevel;
  code: string;
  message: string;
  metricKey?: string;
  count?: number;
};

export type ValidationSummary = {
  clientCount: number;
  totalObservations: number;
  missingCount: number;
  invalidCount: number;
  completeness: Record<TimePoint, number>;
};

export type ValidationResult = {
  issues: ValidationIssue[];
  summary: ValidationSummary;
  canGenerate: boolean;
};

const TIME_POINTS: TimePoint[] = ["baseline", "3mo", "6mo"];
const TIME_POINT_LABELS: Record<TimePoint, string> = {
  baseline: "Baseline",
  "3mo": "3 months",
  "6mo": "6 months",
};

export function validateParsedWorkbook(
  parsed: ParsedPwiWorkbook
): ValidationResult {
  return validateObservations(parsed.observations, parsed.clientCount, parsed.warnings);
}

export function validateObservations(
  observations: ParsedObservation[],
  clientCount: number,
  importWarnings: string[] = []
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const warning of importWarnings) {
    issues.push({ level: "warning", code: "import", message: warning });
  }

  // Time point completeness: count present (non-missing) observations.
  const completeness: Record<TimePoint, number> = {
    baseline: 0,
    "3mo": 0,
    "6mo": 0,
  };
  const presentByTimePoint: Record<TimePoint, number> = {
    baseline: 0,
    "3mo": 0,
    "6mo": 0,
  };
  const totalByTimePoint: Record<TimePoint, number> = {
    baseline: 0,
    "3mo": 0,
    "6mo": 0,
  };

  let missingCount = 0;
  let invalidCount = 0;
  const invalidByMetric = new Map<string, number>();
  const missingByMetric = new Map<string, number>();
  const unknownMetrics = new Set<string>();

  for (const obs of observations) {
    totalByTimePoint[obs.timePoint] += 1;
    const metric = metricByKey(obs.metricKey);
    if (!metric) {
      unknownMetrics.add(obs.metricKey);
      continue;
    }

    if (obs.isMissing) {
      missingCount += 1;
      missingByMetric.set(
        obs.metricKey,
        (missingByMetric.get(obs.metricKey) ?? 0) + 1
      );
      continue;
    }

    presentByTimePoint[obs.timePoint] += 1;

    if (obs.numericValue === null) {
      invalidCount += 1;
      invalidByMetric.set(
        obs.metricKey,
        (invalidByMetric.get(obs.metricKey) ?? 0) + 1
      );
    } else if (
      obs.numericValue < metric.scaleMin ||
      obs.numericValue > metric.scaleMax
    ) {
      invalidCount += 1;
      invalidByMetric.set(
        obs.metricKey,
        (invalidByMetric.get(obs.metricKey) ?? 0) + 1
      );
    }
  }

  for (const tp of TIME_POINTS) {
    completeness[tp] =
      totalByTimePoint[tp] === 0
        ? 0
        : presentByTimePoint[tp] / totalByTimePoint[tp];
  }

  if (clientCount === 0) {
    issues.push({
      level: "error",
      code: "no_clients",
      message: "No client records were found to report on.",
    });
  }

  for (const metricKey of unknownMetrics) {
    issues.push({
      level: "error",
      code: "unknown_metric",
      message: `Encountered an unknown metric key "${metricKey}".`,
      metricKey,
    });
  }

  for (const [metricKey, count] of invalidByMetric) {
    const metric = metricByKey(metricKey);
    issues.push({
      level: "warning",
      code: "out_of_range",
      message: `${metric?.label ?? metricKey}: ${count} value(s) fall outside the expected ${metric?.scaleMin}-${metric?.scaleMax} range and were excluded.`,
      metricKey,
      count,
    });
  }

  for (const tp of TIME_POINTS) {
    if (totalByTimePoint[tp] > 0 && completeness[tp] < 0.5) {
      issues.push({
        level: "warning",
        code: "low_completeness",
        message: `${TIME_POINT_LABELS[tp]} data is only ${Math.round(
          completeness[tp] * 100
        )}% complete; averages may be based on a small sample.`,
      });
    }
  }

  if (presentByTimePoint.baseline === 0) {
    issues.push({
      level: "warning",
      code: "no_baseline",
      message:
        "No baseline values are present, so change-from-baseline cannot be calculated.",
    });
  }

  if (missingCount > 0) {
    issues.push({
      level: "info",
      code: "missing_excluded",
      message: `${missingCount} blank or "Don't know" response(s) were excluded from averages.`,
      count: missingCount,
    });
  }

  const hasError = issues.some((i) => i.level === "error");

  return {
    issues,
    summary: {
      clientCount,
      totalObservations: observations.length,
      missingCount,
      invalidCount,
      completeness,
    },
    canGenerate: !hasError,
  };
}

export { METRIC_DEFINITIONS, TIME_POINTS, TIME_POINT_LABELS };

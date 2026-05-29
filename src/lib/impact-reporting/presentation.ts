import { METRIC_DEFINITIONS } from "./metrics/definitions";
import { roundOrNull } from "./metrics/engine";
import type { TimePoint } from "@/db/schema";

export type FlatResult = {
  metricKey: string;
  cohortId: string | null;
  timePoint: TimePoint;
  avgValue: number | null;
  nCount: number;
  missingCount: number;
  changeFromBaseline: number | null;
};

export type MetricRow = {
  key: string;
  label: string;
  category: string;
  scaleType: string;
  scaleMax: number;
  baseline: number | null;
  threeMo: number | null;
  sixMo: number | null;
  change3: number | null;
  change6: number | null;
  nBaseline: number;
  n3: number;
  n6: number;
  missing: number;
};

/**
 * Pivots flat per-time-point aggregates into one row per metric for a given
 * cohort (pass cohortId = null for the overall group).
 */
export function pivotByMetric(
  results: FlatResult[],
  cohortId: string | null
): MetricRow[] {
  const scoped = results.filter((r) => r.cohortId === cohortId);

  return METRIC_DEFINITIONS.map((metric) => {
    const forMetric = scoped.filter((r) => r.metricKey === metric.key);
    const at = (tp: TimePoint) => forMetric.find((r) => r.timePoint === tp);
    const baseline = at("baseline");
    const three = at("3mo");
    const six = at("6mo");

    return {
      key: metric.key,
      label: metric.label,
      category: metric.category,
      scaleType: metric.scaleType,
      scaleMax: metric.scaleMax,
      baseline: roundOrNull(baseline?.avgValue ?? null),
      threeMo: roundOrNull(three?.avgValue ?? null),
      sixMo: roundOrNull(six?.avgValue ?? null),
      change3: roundOrNull(three?.changeFromBaseline ?? null),
      change6: roundOrNull(six?.changeFromBaseline ?? null),
      nBaseline: baseline?.nCount ?? 0,
      n3: three?.nCount ?? 0,
      n6: six?.nCount ?? 0,
      missing:
        (baseline?.missingCount ?? 0) +
        (three?.missingCount ?? 0) +
        (six?.missingCount ?? 0),
    };
  });
}

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

export function formatChange(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

/** Completion rate of a time point as a percentage of total client rows. */
export function completionRate(present: number, total: number): number {
  return total === 0 ? 0 : Math.round((present / total) * 100);
}

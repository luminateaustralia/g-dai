import { METRIC_DEFINITIONS, metricByKey } from "./definitions";
import type { TimePoint } from "@/db/schema";

export type ObservationInput = {
  metricKey: string;
  cohortId: string | null;
  timePoint: TimePoint;
  numericValue: number | null;
  isMissing: boolean;
};

export type MetricAggregate = {
  metricKey: string;
  cohortId: string | null;
  timePoint: TimePoint;
  avgValue: number | null;
  nCount: number;
  missingCount: number;
  changeFromBaseline: number | null;
};

const TIME_POINTS: TimePoint[] = ["baseline", "3mo", "6mo"];

type Accumulator = { sum: number; n: number; missing: number };

function emptyAcc(): Accumulator {
  return { sum: 0, n: 0, missing: 0 };
}

/**
 * Aggregates observations into per-metric, per-time-point averages and change
 * scores. Produces an "overall" group (cohortId = null) plus one group per
 * cohort. Blank and "Don't know" responses are excluded; out-of-range values
 * are also excluded from averages.
 */
export function computeAggregates(
  observations: ObservationInput[]
): MetricAggregate[] {
  const cohortIds = new Set<string | null>([null]);
  for (const obs of observations) {
    if (obs.cohortId) cohortIds.add(obs.cohortId);
  }

  const results: MetricAggregate[] = [];

  for (const cohortId of cohortIds) {
    const relevant =
      cohortId === null
        ? observations
        : observations.filter((o) => o.cohortId === cohortId);

    for (const metric of METRIC_DEFINITIONS) {
      const accByTime: Record<TimePoint, Accumulator> = {
        baseline: emptyAcc(),
        "3mo": emptyAcc(),
        "6mo": emptyAcc(),
      };

      for (const obs of relevant) {
        if (obs.metricKey !== metric.key) continue;
        const acc = accByTime[obs.timePoint];
        if (obs.isMissing) {
          acc.missing += 1;
          continue;
        }
        if (
          obs.numericValue === null ||
          obs.numericValue < metric.scaleMin ||
          obs.numericValue > metric.scaleMax
        ) {
          continue; // Out-of-range / unparseable: excluded from the average.
        }
        acc.sum += obs.numericValue;
        acc.n += 1;
      }

      const baselineAvg =
        accByTime.baseline.n > 0
          ? accByTime.baseline.sum / accByTime.baseline.n
          : null;

      for (const tp of TIME_POINTS) {
        const acc = accByTime[tp];
        const avg = acc.n > 0 ? acc.sum / acc.n : null;
        const change =
          tp !== "baseline" && avg !== null && baselineAvg !== null
            ? avg - baselineAvg
            : null;
        results.push({
          metricKey: metric.key,
          cohortId,
          timePoint: tp,
          avgValue: avg,
          nCount: acc.n,
          missingCount: acc.missing,
          changeFromBaseline: change,
        });
      }
    }
  }

  return results;
}

export function roundOrNull(value: number | null, dp = 2): number | null {
  if (value === null) return null;
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

export { METRIC_DEFINITIONS, metricByKey, TIME_POINTS };

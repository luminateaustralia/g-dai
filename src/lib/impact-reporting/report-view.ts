import { METRIC_DEFINITIONS } from "./metrics/definitions";
import { roundOrNull } from "./metrics/engine";
import { pivotByMetric, type FlatResult, type MetricRow } from "./presentation";
import type { LoadedReport } from "./report-service";
import type {
  ChangeDatum,
  CohortDatum,
  CompletionDatum,
  JourneyDatum,
  MovementDatum,
  PeriodTrendDatum,
} from "@/components/impact/charts";
import type { ImpactCohort, ImpactReport, TimePoint } from "@/db/schema";

const PWI_KEYS = METRIC_DEFINITIONS.filter((m) => m.category === "pwi").map(
  (m) => m.key
);

function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

function pwiAverage(rows: MetricRow[], field: "baseline" | "sixMo") {
  return average(
    rows.filter((r) => PWI_KEYS.includes(r.key)).map((r) => r[field])
  );
}

export type MetricsView = {
  overallRows: MetricRow[];
  cohortSections: { cohort: ImpactCohort; rows: MetricRow[] }[];
  movementPwi: MovementDatum[];
  movementWork: MovementDatum[];
  changeData: ChangeDatum[];
  cohortData: CohortDatum[];
  completionData: CompletionDatum[];
};

export type ReportView = MetricsView & {
  stats: {
    clients: number;
    pwiBaseline: number | null;
    pwiSixMo: number | null;
    pwiChange: number | null;
    completedProgramPct: number | null;
    employedPct: number | null;
  };
};

const TIME_POINT_LABELS: Record<TimePoint, string> = {
  baseline: "Baseline",
  "3mo": "3 months",
  "6mo": "6 months",
};

export function buildMetricsView(
  results: FlatResult[],
  cohorts: ImpactCohort[]
): MetricsView {
  const overallRows = pivotByMetric(results, null);

  const cohortSections = cohorts.map((cohort) => ({
    cohort,
    rows: pivotByMetric(results, cohort.id),
  }));

  const toMovement = (rows: MetricRow[]): MovementDatum[] =>
    rows.map((r) => ({
      label: r.label,
      baseline: r.baseline,
      threeMo: r.threeMo,
      sixMo: r.sixMo,
    }));

  const movementPwi = toMovement(
    overallRows.filter((r) => r.category === "pwi")
  );
  const movementWork = toMovement(
    overallRows.filter((r) => r.category !== "pwi")
  );

  const changeData: ChangeDatum[] = overallRows
    .filter((r) => r.change6 !== null)
    .map((r) => ({ label: r.label, change: r.change6 as number }));

  const cohortData: CohortDatum[] = cohortSections.map(({ cohort, rows }) => ({
    cohort: cohort.name,
    baseline: roundOrNull(pwiAverage(rows, "baseline")),
    sixMo: roundOrNull(pwiAverage(rows, "sixMo")),
  }));

  const timePoints: TimePoint[] = ["baseline", "3mo", "6mo"];
  const completionData: CompletionDatum[] = timePoints.map((tp) => {
    const scoped = results.filter(
      (r) => r.cohortId === null && r.timePoint === tp
    );
    const rates = scoped.map((r) => {
      const total = r.nCount + r.missingCount;
      return total === 0 ? null : r.nCount / total;
    });
    const avg = average(rates);
    return {
      label: TIME_POINT_LABELS[tp],
      completion: avg === null ? 0 : Math.round(avg * 100),
    };
  });

  return {
    overallRows,
    cohortSections,
    movementPwi,
    movementWork,
    changeData,
    cohortData,
    completionData,
  };
}

export function buildReportView(loaded: LoadedReport): ReportView {
  const metricsView = buildMetricsView(loaded.results, loaded.cohorts);

  // Client count = present + missing for any metric at baseline.
  const baselineSample = loaded.results.find(
    (r) => r.cohortId === null && r.timePoint === "baseline"
  );
  const clients = baselineSample
    ? baselineSample.nCount + baselineSample.missingCount
    : 0;

  const pwiBaseline = roundOrNull(
    pwiAverage(metricsView.overallRows, "baseline")
  );
  const pwiSixMo = roundOrNull(pwiAverage(metricsView.overallRows, "sixMo"));
  const pwiChange =
    pwiBaseline !== null && pwiSixMo !== null
      ? roundOrNull(pwiSixMo - pwiBaseline)
      : null;

  const completedProgramPct =
    loaded.completion.totalIntakes > 0
      ? Math.round(
          (loaded.completion.completedProgram /
            loaded.completion.totalIntakes) *
            100
        )
      : null;
  const employedPct =
    loaded.completion.totalIntakes > 0
      ? Math.round(
          (loaded.completion.employed / loaded.completion.totalIntakes) * 100
        )
      : null;

  return {
    ...metricsView,
    stats: {
      clients,
      pwiBaseline,
      pwiSixMo,
      pwiChange,
      completedProgramPct,
      employedPct,
    },
  };
}

const STAGE_FIELDS: { field: "baseline" | "threeMo" | "sixMo"; label: string }[] =
  [
    { field: "baseline", label: "Baseline" },
    { field: "threeMo", label: "3 months" },
    { field: "sixMo", label: "6 months" },
  ];

/**
 * Average score for a category at a stage, expressed as a percentage of each
 * metric's scale maximum so categories on different scales can share one axis.
 */
function categoryPct(
  rows: MetricRow[],
  category: string,
  field: "baseline" | "threeMo" | "sixMo"
): number | null {
  const scoped = rows.filter((r) => r.category === category);
  const pcts = scoped.map((r) => {
    const value = r[field];
    return value === null || r.scaleMax === 0 ? null : (value / r.scaleMax) * 100;
  });
  return roundOrNull(average(pcts));
}

function buildJourney(overallRows: MetricRow[]): JourneyDatum[] {
  return STAGE_FIELDS.map(({ field, label }) => ({
    stage: label,
    pwi: categoryPct(overallRows, "pwi", field),
    wellbeing: categoryPct(overallRows, "wellbeing", field),
    work: categoryPct(overallRows, "work_readiness", field),
  }));
}

export type WellbeingDashboardView = {
  reportCount: number;
  latest: {
    report: ImpactReport;
    period: LoadedReport["period"];
    view: ReportView;
  } | null;
  /** PWI 6-month delta versus the previous reporting period, if any. */
  periodOverPeriodChange: number | null;
  journey: JourneyDatum[];
  periodTrend: PeriodTrendDatum[];
};

function periodLabel(loaded: LoadedReport): string {
  if (loaded.period?.label) return loaded.period.label;
  const date = loaded.report.dataFreshnessAt ?? loaded.report.generatedAt;
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Builds the wellbeing landing dashboard from every generated report (newest
 * first). Headline figures and the programme journey use the most recent
 * report; the period trend spans all reports oldest to newest.
 */
export function buildWellbeingDashboard(
  reports: LoadedReport[]
): WellbeingDashboardView {
  if (!reports.length) {
    return {
      reportCount: 0,
      latest: null,
      periodOverPeriodChange: null,
      journey: [],
      periodTrend: [],
    };
  }

  const latestLoaded = reports[0];
  const latestView = buildReportView(latestLoaded);

  const previousView = reports[1] ? buildReportView(reports[1]) : null;
  const periodOverPeriodChange =
    previousView &&
    latestView.stats.pwiSixMo !== null &&
    previousView.stats.pwiSixMo !== null
      ? roundOrNull(latestView.stats.pwiSixMo - previousView.stats.pwiSixMo)
      : null;

  const periodTrend: PeriodTrendDatum[] = [...reports]
    .reverse()
    .map((loaded) => {
      const view = buildReportView(loaded);
      return {
        label: periodLabel(loaded),
        baseline: view.stats.pwiBaseline,
        sixMo: view.stats.pwiSixMo,
      };
    });

  return {
    reportCount: reports.length,
    latest: {
      report: latestLoaded.report,
      period: latestLoaded.period,
      view: latestView,
    },
    periodOverPeriodChange,
    journey: buildJourney(latestView.overallRows),
    periodTrend,
  };
}

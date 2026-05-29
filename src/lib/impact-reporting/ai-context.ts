import { CATEGORY_LABELS, metricByKey } from "./metrics/definitions";
import type { MetricRow } from "./presentation";
import { buildReportView } from "./report-view";
import type { LoadedReport } from "./report-service";

function num(value: number | null): string {
  return value === null ? "n/a" : value.toFixed(2);
}

function signed(value: number | null): string {
  if (value === null) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function pct(value: number | null): string {
  return value === null ? "n/a" : `${value}%`;
}

function formatDate(value: Date | null): string {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(value);
}

function metricsTable(rows: MetricRow[]): string {
  const header =
    "| Metric | Category | Scale | Baseline | 3 months | 6 months | Change baseline→6mo | Direction | Responses (n at 6mo) |";
  const divider = "| --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows.map((row) => {
    const definition = metricByKey(row.key);
    const category = CATEGORY_LABELS[row.category as keyof typeof CATEGORY_LABELS] ?? row.category;
    const direction = definition?.higherIsBetter
      ? "higher is better"
      : "lower is better";
    return `| ${row.label} | ${category} | ${row.scaleType} | ${num(row.baseline)} | ${num(row.threeMo)} | ${num(row.sixMo)} | ${signed(row.change6)} | ${direction} | ${row.n6} |`;
  });
  return [header, divider, ...body].join("\n");
}

/**
 * Builds a compact, grounded markdown summary of a frozen wellbeing report for
 * use as the AI assistant's system context. Only aggregate figures are
 * included (the frozen results carry no client names), so this is safe even for
 * de-identified reports.
 */
export function buildReportAiContext(loaded: LoadedReport): string {
  const view = buildReportView(loaded);
  const { stats } = view;
  const { report, period } = loaded;

  const sections: string[] = [];

  sections.push(
    [
      `# Report: ${report.title}`,
      period?.label ? `Reporting period: ${period.label}` : null,
      `Data as at: ${formatDate(report.dataFreshnessAt)}`,
      `De-identified: ${report.deidentified ? "yes" : "no"}`,
      `Scales differ per metric (shown in the Scale column). All "Change" figures are baseline to 6 months.`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  sections.push(
    [
      "## Headline figures",
      `- Clients in this period: ${stats.clients}`,
      `- Personal Wellbeing Index average — baseline: ${num(stats.pwiBaseline)}, 6 months: ${num(stats.pwiSixMo)}, change: ${signed(stats.pwiChange)} (0–10 scale)`,
      `- Programme completion: ${pct(stats.completedProgramPct)} of tracked intakes`,
      `- Employment: ${pct(stats.employedPct)} of tracked intakes`,
    ].join("\n")
  );

  sections.push(
    ["## Overall metrics", metricsTable(view.overallRows)].join("\n")
  );

  for (const section of view.cohortSections) {
    sections.push(
      [`## Cohort: ${section.cohort.name}`, metricsTable(section.rows)].join("\n")
    );
  }

  if (report.methodologyNotes) {
    sections.push(["## Methodology notes", report.methodologyNotes].join("\n"));
  }

  return sections.join("\n\n");
}

/**
 * Suggested starter questions shown in the assistant panel. Curated questions
 * are grounded in the available metrics; a per-cohort prompt is added when the
 * report has cohort breakdowns.
 */
export function buildReportExampleQuestions(loaded: LoadedReport): string[] {
  const questions = [
    "What's the headline story I'd tell a funder about this report?",
    "Which wellbeing domain improved the most from baseline to 6 months?",
    "Did financial worry change over the programme?",
    "Were there any measures that regressed or need attention?",
    "Summarise the programme completion and employment outcomes.",
  ];

  const firstCohort = loaded.cohorts[0];
  if (firstCohort) {
    questions.push(
      `How did the ${firstCohort.name} cohort compare on overall wellbeing?`
    );
  }

  return questions;
}

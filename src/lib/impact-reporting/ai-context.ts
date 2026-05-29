import { BRAND_VOICE_GUIDE } from "@/lib/ai/brand-profile";
import { CATEGORY_LABELS, metricByKey } from "./metrics/definitions";
import type { MetricRow } from "./presentation";
import { buildReportView, buildWellbeingDashboard } from "./report-view";
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

/**
 * Builds grounding context for the wellbeing dashboard, which spans every
 * generated report. Combines the latest report's full figures with the trend
 * across all reporting periods so the assistant can answer both point-in-time
 * and over-time questions.
 */
export function buildDashboardAiContext(reports: LoadedReport[]): string {
  if (!reports.length) {
    return "No wellbeing reports have been generated yet.";
  }

  const dashboard = buildWellbeingDashboard(reports);
  const latest = reports[0];
  const sections: string[] = [];

  sections.push(
    [
      "# Wellbeing overview",
      `Reports generated: ${reports.length}`,
      dashboard.periodOverPeriodChange !== null
        ? `Personal Wellbeing Index 6-month change versus the previous reporting period: ${signed(dashboard.periodOverPeriodChange)}`
        : null,
      "The latest report's full figures are below, followed by the trend across all reporting periods.",
    ]
      .filter(Boolean)
      .join("\n")
  );

  sections.push(["## Latest report", buildReportAiContext(latest)].join("\n\n"));

  if (dashboard.periodTrend.length > 1) {
    const header = "| Reporting period | PWI baseline | PWI 6 months |";
    const divider = "| --- | --- | --- |";
    const body = dashboard.periodTrend.map(
      (point) => `| ${point.label} | ${num(point.baseline)} | ${num(point.sixMo)} |`
    );
    sections.push(
      [
        "## Trend across reporting periods (oldest to newest)",
        [header, divider, ...body].join("\n"),
      ].join("\n")
    );
  }

  return sections.join("\n\n");
}

/** Suggested starter questions for the dashboard-level assistant. */
export function buildDashboardExampleQuestions(): string[] {
  return [
    "What's the headline wellbeing story across our reporting periods?",
    "How has the Personal Wellbeing Index changed over time?",
    "Which areas improved the most in the latest report?",
    "Are any measures trending in the wrong direction?",
    "Summarise the programme completion and employment outcomes.",
  ];
}

/**
 * Shared system prompt for the wellbeing AI assistant. Grounds responses in the
 * supplied report data and the Two Good Co brand voice.
 */
export function buildAssistantSystemPrompt(context: string): string {
  return [
    "You are a wellbeing reporting assistant for Two Good Co's programme team.",
    "Answer questions strictly using the report data provided below.",
    "If the data does not contain the answer, say so plainly rather than guessing.",
    "Never invent figures; only cite numbers that appear in the data.",
    "Interpret each metric using its scale and direction (e.g. higher is better).",
    "Be concise and clear for a non-analyst audience.",
    "Ground all wording, framing, and the reasoning behind any recommendations in the Two Good Co brand voice below — warm, human, purposeful, and dignity-led. Write in Australian English.",
    "",
    "## Brand voice",
    BRAND_VOICE_GUIDE,
    "",
    "## Report data",
    context,
  ].join("\n");
}

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const TIME_POINTS = ["baseline", "3mo", "6mo"] as const;
export type TimePoint = (typeof TIME_POINTS)[number];

/**
 * Record of each spreadsheet ingestion run for the impact reporting feature.
 * Preserves a checksum so identical re-imports are reproducible and auditable.
 */
export const impactSourceImport = sqliteTable("impact_source_import", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  checksum: text("checksum"),
  observationCount: integer("observation_count").notNull().default(0),
  intakeCount: integer("intake_count").notNull().default(0),
  status: text("status").notNull().default("imported"),
  notes: text("notes"),
});

export const impactCohort = sqliteTable("impact_cohort", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Configurable metric definitions. Scoring rules live here rather than being
 * hard-coded so the metric engine can be reconfigured without code changes.
 */
export const impactMetricDefinition = sqliteTable("impact_metric_definition", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  fullQuestion: text("full_question"),
  domain: text("domain").notNull(),
  category: text("category").notNull(),
  scaleType: text("scale_type").notNull(),
  scaleMin: real("scale_min").notNull(),
  scaleMax: real("scale_max").notNull(),
  // JSON array of raw values treated as missing (e.g. "Don't know").
  missingValues: text("missing_values").notNull().default("[]"),
  higherIsBetter: integer("higher_is_better", { mode: "boolean" })
    .notNull()
    .default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

/**
 * Tidy/long observation store: one row per client x metric x time point.
 * Raw value is preserved alongside the parsed numeric value for auditability.
 */
export const clientOutcomeObservation = sqliteTable(
  "client_outcome_observation",
  {
    id: text("id").primaryKey(),
    importId: text("import_id").notNull(),
    intakeNumber: text("intake_number").notNull(),
    cohortId: text("cohort_id"),
    clientName: text("client_name"),
    metricKey: text("metric_key").notNull(),
    timePoint: text("time_point").$type<TimePoint>().notNull(),
    rawValue: text("raw_value"),
    numericValue: real("numeric_value"),
    isMissing: integer("is_missing", { mode: "boolean" })
      .notNull()
      .default(false),
  }
);

/**
 * Intake/program completion and employment indicators (Intakes sheet).
 * Extra/messy columns are retained as raw JSON.
 */
export const intakeOutcome = sqliteTable("intake_outcome", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull(),
  intakeNumber: text("intake_number").notNull(),
  name: text("name"),
  cohort: text("cohort"),
  completedProgram: integer("completed_program", { mode: "boolean" }),
  employed: integer("employed", { mode: "boolean" }),
  rawData: text("raw_data"),
});

export const impactReportPeriod = sqliteTable("impact_report_period", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const impactReport = sqliteTable("impact_report", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  periodId: text("period_id"),
  importId: text("import_id"),
  status: text("status").notNull().default("draft"),
  deidentified: integer("deidentified", { mode: "boolean" })
    .notNull()
    .default(true),
  methodologyNotes: text("methodology_notes"),
  generatedBy: text("generated_by"),
  generatedAt: integer("generated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  dataFreshnessAt: integer("data_freshness_at", { mode: "timestamp_ms" }),
});

/**
 * Frozen snapshot of computed metrics for a report so outputs are reproducible
 * from the report record alone, independent of later source changes.
 */
export const impactMetricResult = sqliteTable("impact_metric_result", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  metricKey: text("metric_key").notNull(),
  cohortId: text("cohort_id"),
  timePoint: text("time_point").$type<TimePoint>().notNull(),
  avgValue: real("avg_value"),
  nCount: integer("n_count").notNull().default(0),
  missingCount: integer("missing_count").notNull().default(0),
  changeFromBaseline: real("change_from_baseline"),
});

export type ImpactSourceImport = typeof impactSourceImport.$inferSelect;
export type ImpactMetricDefinition = typeof impactMetricDefinition.$inferSelect;
export type ClientOutcomeObservation =
  typeof clientOutcomeObservation.$inferSelect;
export type IntakeOutcome = typeof intakeOutcome.$inferSelect;
export type ImpactReport = typeof impactReport.$inferSelect;
export type ImpactMetricResult = typeof impactMetricResult.$inferSelect;
export type ImpactCohort = typeof impactCohort.$inferSelect;
export type ImpactReportPeriod = typeof impactReportPeriod.$inferSelect;

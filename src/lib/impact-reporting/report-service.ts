import { desc, eq, inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  clientOutcomeObservation,
  impactCohort,
  impactMetricResult,
  impactReport,
  impactReportPeriod,
  impactSourceImport,
  intakeOutcome,
  type ImpactCohort,
  type ImpactMetricResult,
  type ImpactReport,
} from "@/db/schema";
import { newId } from "@/lib/id";
import { writeAudit } from "@/lib/audit";
import { d1InsertChunkSize } from "@/lib/db/d1-limits";
import { ensureSeeded } from "@/lib/seed";
import type { CurrentUser } from "@/lib/auth/session";
import { computeAggregates, type ObservationInput } from "./metrics/engine";
import {
  validateObservations,
  type ValidationResult,
} from "./validation/validate";

export async function getLatestImport(db: Database) {
  const rows = await db
    .select()
    .from(impactSourceImport)
    .orderBy(desc(impactSourceImport.uploadedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listImports(db: Database) {
  return db
    .select()
    .from(impactSourceImport)
    .orderBy(desc(impactSourceImport.uploadedAt));
}

async function loadObservationRows(db: Database, importId: string) {
  return db
    .select()
    .from(clientOutcomeObservation)
    .where(eq(clientOutcomeObservation.importId, importId));
}

function toObservationInputs(
  rows: Awaited<ReturnType<typeof loadObservationRows>>
): ObservationInput[] {
  return rows.map((r) => ({
    metricKey: r.metricKey,
    cohortId: r.cohortId,
    timePoint: r.timePoint,
    numericValue: r.numericValue,
    isMissing: r.isMissing,
  }));
}

export type ImportPreview = {
  importId: string;
  filename: string;
  clientCount: number;
  cohorts: ImpactCohort[];
  validation: ValidationResult;
  aggregates: ReturnType<typeof computeAggregates>;
};

export async function buildImportPreview(
  db: Database,
  importId: string
): Promise<ImportPreview | null> {
  await ensureSeeded(db);
  const importRows = await db
    .select()
    .from(impactSourceImport)
    .where(eq(impactSourceImport.id, importId))
    .limit(1);
  const sourceImport = importRows[0];
  if (!sourceImport) return null;

  const rows = await loadObservationRows(db, importId);
  const clientCount = new Set(rows.map((r) => r.intakeNumber)).size;

  const validation = validateObservations(
    rows.map((r) => ({
      intakeNumber: r.intakeNumber,
      clientName: r.clientName,
      cohortName: null,
      metricKey: r.metricKey,
      timePoint: r.timePoint,
      rawValue: r.rawValue,
      numericValue: r.numericValue,
      isMissing: r.isMissing,
    })),
    clientCount
  );

  const cohortIds = Array.from(
    new Set(rows.map((r) => r.cohortId).filter((id): id is string => !!id))
  );
  const cohorts = cohortIds.length
    ? await db
        .select()
        .from(impactCohort)
        .where(inArray(impactCohort.id, cohortIds))
    : [];

  return {
    importId,
    filename: sourceImport.filename,
    clientCount,
    cohorts,
    validation,
    aggregates: computeAggregates(toObservationInputs(rows)),
  };
}

export async function generateReport(
  db: Database,
  options: {
    importId: string;
    title: string;
    periodLabel?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    methodologyNotes?: string | null;
    deidentified: boolean;
    user: CurrentUser;
  }
): Promise<string> {
  await ensureSeeded(db);

  const rows = await loadObservationRows(db, options.importId);
  if (!rows.length) {
    throw new Error("This import has no observations to report on.");
  }
  const aggregates = computeAggregates(toObservationInputs(rows));

  let periodId: string | null = null;
  if (options.periodLabel) {
    periodId = newId();
    await db.insert(impactReportPeriod).values({
      id: periodId,
      label: options.periodLabel,
      startDate: options.periodStart ?? null,
      endDate: options.periodEnd ?? null,
    });
  }

  const reportId = newId();
  await db.insert(impactReport).values({
    id: reportId,
    title: options.title,
    periodId,
    importId: options.importId,
    status: "generated",
    deidentified: options.deidentified,
    methodologyNotes: options.methodologyNotes ?? null,
    generatedBy: options.user.id,
    dataFreshnessAt: new Date(),
  });

  const resultRows = aggregates.map((agg) => ({
    id: newId(),
    reportId,
    metricKey: agg.metricKey,
    cohortId: agg.cohortId,
    timePoint: agg.timePoint,
    avgValue: agg.avgValue,
    nCount: agg.nCount,
    missingCount: agg.missingCount,
    changeFromBaseline: agg.changeFromBaseline,
  }));

  const chunk = d1InsertChunkSize(9);
  for (let i = 0; i < resultRows.length; i += chunk) {
    await db.insert(impactMetricResult).values(resultRows.slice(i, i + chunk));
  }

  await writeAudit(db, {
    actor: options.user,
    action: "impact.generate",
    entityType: "impact_report",
    entityId: reportId,
    detail: { title: options.title, importId: options.importId },
  });

  return reportId;
}

export type LoadedReport = {
  report: ImpactReport;
  period: { label: string; startDate: string | null; endDate: string | null } | null;
  results: ImpactMetricResult[];
  cohorts: ImpactCohort[];
  completion: {
    totalIntakes: number;
    completedProgram: number;
    employed: number;
  };
};

export async function getReport(
  db: Database,
  reportId: string
): Promise<LoadedReport | null> {
  await ensureSeeded(db);
  const reportRows = await db
    .select()
    .from(impactReport)
    .where(eq(impactReport.id, reportId))
    .limit(1);
  const report = reportRows[0];
  if (!report) return null;

  const results = await db
    .select()
    .from(impactMetricResult)
    .where(eq(impactMetricResult.reportId, reportId));

  const cohortIds = Array.from(
    new Set(results.map((r) => r.cohortId).filter((id): id is string => !!id))
  );
  const cohorts = cohortIds.length
    ? await db
        .select()
        .from(impactCohort)
        .where(inArray(impactCohort.id, cohortIds))
    : [];

  let period: LoadedReport["period"] = null;
  if (report.periodId) {
    const periodRows = await db
      .select()
      .from(impactReportPeriod)
      .where(eq(impactReportPeriod.id, report.periodId))
      .limit(1);
    if (periodRows[0]) {
      period = {
        label: periodRows[0].label,
        startDate: periodRows[0].startDate,
        endDate: periodRows[0].endDate,
      };
    }
  }

  const completion = { totalIntakes: 0, completedProgram: 0, employed: 0 };
  if (report.importId) {
    const intakes = await db
      .select()
      .from(intakeOutcome)
      .where(eq(intakeOutcome.importId, report.importId));
    completion.totalIntakes = intakes.length;
    completion.completedProgram = intakes.filter(
      (i) => i.completedProgram === true
    ).length;
    completion.employed = intakes.filter((i) => i.employed === true).length;
  }

  return { report, period, results, cohorts, completion };
}

export async function listReports(db: Database): Promise<ImpactReport[]> {
  return db
    .select()
    .from(impactReport)
    .orderBy(desc(impactReport.generatedAt));
}

/**
 * Bulk-loads every generated report with its frozen results, cohorts, period
 * and completion counts in a fixed number of queries. Ordered newest first.
 * Used by the wellbeing dashboard to chart trends across reporting periods.
 */
export async function loadAllReports(db: Database): Promise<LoadedReport[]> {
  await ensureSeeded(db);

  const reports = await db
    .select()
    .from(impactReport)
    .orderBy(desc(impactReport.generatedAt));
  if (!reports.length) return [];

  const reportIds = reports.map((r) => r.id);
  const allResults = await db
    .select()
    .from(impactMetricResult)
    .where(inArray(impactMetricResult.reportId, reportIds));

  const resultsByReport = new Map<string, ImpactMetricResult[]>();
  for (const result of allResults) {
    const list = resultsByReport.get(result.reportId) ?? [];
    list.push(result);
    resultsByReport.set(result.reportId, list);
  }

  const cohortIds = Array.from(
    new Set(allResults.map((r) => r.cohortId).filter((id): id is string => !!id))
  );
  const cohorts = cohortIds.length
    ? await db
        .select()
        .from(impactCohort)
        .where(inArray(impactCohort.id, cohortIds))
    : [];
  const cohortById = new Map(cohorts.map((c) => [c.id, c]));

  const periodIds = Array.from(
    new Set(reports.map((r) => r.periodId).filter((id): id is string => !!id))
  );
  const periods = periodIds.length
    ? await db
        .select()
        .from(impactReportPeriod)
        .where(inArray(impactReportPeriod.id, periodIds))
    : [];
  const periodById = new Map(periods.map((p) => [p.id, p]));

  const importIds = Array.from(
    new Set(reports.map((r) => r.importId).filter((id): id is string => !!id))
  );
  const intakes = importIds.length
    ? await db
        .select()
        .from(intakeOutcome)
        .where(inArray(intakeOutcome.importId, importIds))
    : [];
  const intakesByImport = new Map<string, typeof intakes>();
  for (const intake of intakes) {
    const list = intakesByImport.get(intake.importId) ?? [];
    list.push(intake);
    intakesByImport.set(intake.importId, list);
  }

  return reports.map((report) => {
    const results = resultsByReport.get(report.id) ?? [];

    const reportCohortIds = Array.from(
      new Set(results.map((r) => r.cohortId).filter((id): id is string => !!id))
    );
    const reportCohorts = reportCohortIds
      .map((id) => cohortById.get(id))
      .filter((c): c is ImpactCohort => !!c);

    const periodRow = report.periodId ? periodById.get(report.periodId) : null;
    const period: LoadedReport["period"] = periodRow
      ? {
          label: periodRow.label,
          startDate: periodRow.startDate,
          endDate: periodRow.endDate,
        }
      : null;

    const reportIntakes = report.importId
      ? intakesByImport.get(report.importId) ?? []
      : [];
    const completion = {
      totalIntakes: reportIntakes.length,
      completedProgram: reportIntakes.filter((i) => i.completedProgram === true)
        .length,
      employed: reportIntakes.filter((i) => i.employed === true).length,
    };

    return { report, period, results, cohorts: reportCohorts, completion };
  });
}

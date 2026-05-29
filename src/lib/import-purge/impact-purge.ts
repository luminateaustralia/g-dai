import { eq, inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  clientOutcomeObservation,
  impactCohort,
  impactMetricResult,
  impactReport,
  impactReportPeriod,
  impactSourceImport,
  intakeOutcome,
} from "@/db/schema";
import { execInChunks } from "@/lib/db/chunked-in";

export type ImpactPurgeSummary = {
  filename: string;
  reports: number;
  reportPeriods: number;
  observations: number;
  intakes: number;
  cohorts: number;
};

export async function deleteImpactImport(
  db: Database,
  importId: string
): Promise<ImpactPurgeSummary> {
  const [importRow] = await db
    .select()
    .from(impactSourceImport)
    .where(eq(impactSourceImport.id, importId));
  if (!importRow) {
    throw new Error("Import not found.");
  }

  const reports = await db
    .select({ id: impactReport.id })
    .from(impactReport)
    .where(eq(impactReport.importId, importId));
  const reportIds = reports.map((r) => r.id);

  if (reportIds.length) {
    await execInChunks(reportIds, async (chunk) => {
      await db
        .delete(impactMetricResult)
        .where(inArray(impactMetricResult.reportId, chunk));
    });
  }

  await db.delete(impactReport).where(eq(impactReport.importId, importId));

  const periodsInUse = await db
    .selectDistinct({ periodId: impactReport.periodId })
    .from(impactReport);
  const usedPeriodIds = new Set(
    periodsInUse
      .map((p) => p.periodId)
      .filter((id): id is string => id != null)
  );
  const allPeriods = await db
    .select({ id: impactReportPeriod.id })
    .from(impactReportPeriod);
  const orphanPeriodIds = allPeriods
    .map((p) => p.id)
    .filter((id) => !usedPeriodIds.has(id));

  if (orphanPeriodIds.length) {
    await execInChunks(orphanPeriodIds, async (chunk) => {
      await db
        .delete(impactReportPeriod)
        .where(inArray(impactReportPeriod.id, chunk));
    });
  }

  await db
    .delete(clientOutcomeObservation)
    .where(eq(clientOutcomeObservation.importId, importId));
  await db.delete(intakeOutcome).where(eq(intakeOutcome.importId, importId));
  await db
    .delete(impactSourceImport)
    .where(eq(impactSourceImport.id, importId));

  const cohortsInUse = await db
    .selectDistinct({ cohortId: clientOutcomeObservation.cohortId })
    .from(clientOutcomeObservation);
  const usedCohortIds = new Set(
    cohortsInUse
      .map((c) => c.cohortId)
      .filter((id): id is string => id != null)
  );
  const allCohorts = await db.select({ id: impactCohort.id }).from(impactCohort);
  const orphanCohortIds = allCohorts
    .map((c) => c.id)
    .filter((id) => !usedCohortIds.has(id));

  if (orphanCohortIds.length) {
    await execInChunks(orphanCohortIds, async (chunk) => {
      await db.delete(impactCohort).where(inArray(impactCohort.id, chunk));
    });
  }

  return {
    filename: importRow.filename,
    reports: reportIds.length,
    reportPeriods: orphanPeriodIds.length,
    observations: importRow.observationCount,
    intakes: importRow.intakeCount,
    cohorts: orphanCohortIds.length,
  };
}

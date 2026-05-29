import { inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  clientOutcomeObservation,
  impactCohort,
  impactSourceImport,
  intakeOutcome,
} from "@/db/schema";
import { d1InsertChunkSize } from "@/lib/db/d1-limits";
import { newId } from "@/lib/id";
import { writeAudit } from "@/lib/audit";
import { ensureSeeded } from "@/lib/seed";
import {
  computeChecksum,
  readWorkbook,
} from "@/lib/ingestion/workbook";
import type { CurrentUser } from "@/lib/auth/session";
import { parsePwiWorkbook } from "./importers/pwi-tracker";
import {
  validateParsedWorkbook,
  type ValidationResult,
} from "./validation/validate";

const OBSERVATION_CHUNK = d1InsertChunkSize(10);
const INTAKE_CHUNK = d1InsertChunkSize(8);

async function chunkedInsert<T>(
  rows: T[],
  chunkSize: number,
  insertChunk: (chunk: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insertChunk(rows.slice(i, i + chunkSize));
  }
}

export type ImportResult = {
  importId: string;
  filename: string;
  clientCount: number;
  observationCount: number;
  intakeCount: number;
  validation: ValidationResult;
};

export async function importPwiWorkbook(
  db: Database,
  options: { buffer: ArrayBuffer; filename: string; user: CurrentUser }
): Promise<ImportResult> {
  await ensureSeeded(db);

  const wb = readWorkbook(options.buffer);
  const parsed = parsePwiWorkbook(wb);
  const validation = validateParsedWorkbook(parsed);
  const checksum = await computeChecksum(options.buffer);

  const importId = newId();
  await db.insert(impactSourceImport).values({
    id: importId,
    filename: options.filename,
    uploadedBy: options.user.id,
    checksum,
    observationCount: parsed.observations.length,
    intakeCount: parsed.intakes.length,
    status: validation.canGenerate ? "imported" : "imported_with_errors",
  });

  // Resolve cohorts to stable ids.
  const cohortIdByName = new Map<string, string>();
  if (parsed.cohortNames.length) {
    await db
      .insert(impactCohort)
      .values(parsed.cohortNames.map((name) => ({ id: newId(), name })))
      .onConflictDoNothing();
    const cohorts = await db
      .select()
      .from(impactCohort)
      .where(inArray(impactCohort.name, parsed.cohortNames));
    for (const c of cohorts) cohortIdByName.set(c.name, c.id);
  }

  await chunkedInsert(parsed.observations, OBSERVATION_CHUNK, (chunk) =>
    db.insert(clientOutcomeObservation).values(
      chunk.map((obs) => ({
        id: newId(),
        importId,
        intakeNumber: obs.intakeNumber,
        cohortId: obs.cohortName
          ? (cohortIdByName.get(obs.cohortName) ?? null)
          : null,
        clientName: obs.clientName,
        metricKey: obs.metricKey,
        timePoint: obs.timePoint,
        rawValue: obs.rawValue,
        numericValue: obs.numericValue,
        isMissing: obs.isMissing,
      }))
    )
  );

  await chunkedInsert(parsed.intakes, INTAKE_CHUNK, (chunk) =>
    db.insert(intakeOutcome).values(
      chunk.map((intake) => ({
        id: newId(),
        importId,
        intakeNumber: intake.intakeNumber,
        name: intake.name,
        cohort: intake.cohort,
        completedProgram: intake.completedProgram,
        employed: intake.employed,
        rawData: intake.rawData,
      }))
    )
  );

  await writeAudit(db, {
    actor: options.user,
    action: "impact.import",
    entityType: "impact_source_import",
    entityId: importId,
    detail: {
      filename: options.filename,
      observations: parsed.observations.length,
      intakes: parsed.intakes.length,
      clients: parsed.clientCount,
      canGenerate: validation.canGenerate,
    },
  });

  return {
    importId,
    filename: options.filename,
    clientCount: parsed.clientCount,
    observationCount: parsed.observations.length,
    intakeCount: parsed.intakes.length,
    validation,
  };
}

"use server";

import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { importPwiWorkbook } from "@/lib/impact-reporting/import-service";
import { generateReport } from "@/lib/impact-reporting/report-service";
import type { UploadState } from "@/components/upload-form";

export async function uploadImpactWorkbookAction(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "impact.import")) {
    return { error: "Your role cannot import impact data." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a workbook to import." };
  }

  let importId: string;
  try {
    const buffer = await file.arrayBuffer();
    const db = await getDb();
    const result = await importPwiWorkbook(db, {
      buffer,
      filename: file.name,
      user,
    });
    importId = result.importId;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not import the workbook.",
    };
  }

  redirect(`/wellbeing/review/${importId}`);
}

export type GenerateState = { error?: string };

export async function generateImpactReportAction(
  _prev: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "impact.generate")) {
    return { error: "Your role cannot generate reports." };
  }

  const importId = String(formData.get("importId") ?? "");
  if (!importId) return { error: "Missing import reference." };

  const title =
    String(formData.get("title") ?? "").trim() || "Quarterly Wellbeing Report";
  const periodLabel = String(formData.get("periodLabel") ?? "").trim() || null;
  const periodStart = String(formData.get("periodStart") ?? "").trim() || null;
  const periodEnd = String(formData.get("periodEnd") ?? "").trim() || null;
  const methodologyNotes =
    String(formData.get("methodologyNotes") ?? "").trim() || null;
  const deidentified = formData.get("deidentified") !== "off";

  let reportId: string;
  try {
    const db = await getDb();
    reportId = await generateReport(db, {
      importId,
      title,
      periodLabel,
      periodStart,
      periodEnd,
      methodologyNotes,
      deidentified,
      user,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not generate report.",
    };
  }

  redirect(`/wellbeing/reports/${reportId}`);
}

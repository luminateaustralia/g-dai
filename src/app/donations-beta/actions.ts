"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { importDonationWorkbook } from "@/lib/close-the-loop/import-service";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import { writeAudit } from "@/lib/audit";
import {
  buildDemoWorkbookBuffer,
  DEMO_WORKBOOK_FILENAME,
} from "@/lib/donations-beta/fixtures/demo-scenario";
import {
  getLatestAllocationRun,
  runAllocationForImport,
} from "@/lib/donations-beta/run-allocation";
import {
  buildAllocationLedger,
  getAllocationDashboardStats,
} from "@/lib/donations-beta/queries";
import {
  buildDonorReports,
  findDonorReport,
} from "@/lib/donations-beta/reports/build-donor-report";
import { sendImpactReportEmail } from "@/lib/donations-beta/reports/send-impact-report";

function betaPaths() {
  return [
    "/donations-beta",
    "/donations-beta/ledger",
    "/donations-beta/reports",
  ];
}

function revalidateBeta() {
  for (const path of betaPaths()) {
    revalidatePath(path);
  }
}

export async function runAllocationAction(importId?: string) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot run allocation.");
  }

  const db = await getDb();
  const targetImportId =
    importId ?? (await getLatestDonationImport(db))?.id ?? null;
  if (!targetImportId) {
    throw new Error("No donation import found.");
  }

  await runAllocationForImport(db, {
    importId: targetImportId,
    user,
  });

  revalidateBeta();
}

export async function loadDemoScenarioAction() {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.import")) {
    throw new Error("Your role cannot load the demo scenario.");
  }

  const db = await getDb();
  const buffer = buildDemoWorkbookBuffer();
  const result = await importDonationWorkbook(db, {
    buffer,
    filename: DEMO_WORKBOOK_FILENAME,
    user,
  });

  await runAllocationForImport(db, {
    importId: result.importId,
    user,
    isDemo: true,
  });

  revalidateBeta();
  redirect("/donations-beta");
}

export async function sendImpactReportAction(recipientKey: string) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot send impact reports.");
  }

  const db = await getDb();
  const latestImport = await getLatestDonationImport(db);
  if (!latestImport) throw new Error("No donation import found.");

  const run = await getLatestAllocationRun(db, latestImport.id);
  if (!run) throw new Error("No allocation run found.");

  const canViewSensitive = roleHasPermission(
    user.role,
    "donations.view_sensitive"
  );
  const ledger = await buildAllocationLedger(db, run.id, {}, canViewSensitive);
  const reports = buildDonorReports(ledger, canViewSensitive);
  const report = findDonorReport(reports, recipientKey);
  if (!report?.email) {
    throw new Error("This donor does not have an email address.");
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const reportUrl = `${origin}/donations-beta/reports/${encodeURIComponent(report.recipientKey)}`;

  await sendImpactReportEmail({
    to: report.email,
    report,
    reportUrl,
  });

  await writeAudit(db, {
    actor: user,
    action: "donations_beta.report_sent",
    entityType: "allocation_run",
    entityId: run.id,
    detail: {
      importId: latestImport.id,
      recipientKey: report.recipientKey,
      email: report.email,
    },
  });

  revalidatePath("/donations-beta/reports");
}

export async function getBetaDashboardData() {
  const db = await getDb();
  const latestImport = await getLatestDonationImport(db);
  const run = latestImport
    ? await getLatestAllocationRun(db, latestImport.id)
    : null;
  const stats = run ? await getAllocationDashboardStats(db, run.id) : null;

  return {
    latestImport,
    run,
    stats,
  };
}

export async function getBetaReportContext(recipientKey: string) {
  const user = await getCurrentUser();
  const db = await getDb();
  const latestImport = await getLatestDonationImport(db);
  const run = latestImport
    ? await getLatestAllocationRun(db, latestImport.id)
    : null;

  if (!run) return { report: null, canSend: false };

  const canViewSensitive = roleHasPermission(
    user.role,
    "donations.view_sensitive"
  );
  const canSend = roleHasPermission(user.role, "donations.resolve");
  const ledger = await buildAllocationLedger(db, run.id, {}, canViewSensitive);
  const reports = buildDonorReports(ledger, canViewSensitive);

  return {
    report: findDonorReport(reports, recipientKey),
    canSend,
  };
}

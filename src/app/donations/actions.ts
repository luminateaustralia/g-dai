"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { donationTrace, TRACE_STATUSES, type TraceStatus } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { importDonationWorkbook } from "@/lib/close-the-loop/import-service";
import { runMatching } from "@/lib/close-the-loop/matching/engine";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import type { UploadState } from "@/components/upload-form";

export async function uploadDonationWorkbookAction(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.import")) {
    return { error: "Your role cannot import donation data." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a workbook to import." };
  }

  try {
    const buffer = await file.arrayBuffer();
    const db = await getDb();
    const result = await importDonationWorkbook(db, {
      buffer,
      filename: file.name,
      user,
    });
    // Run the matching engine immediately so the ledger is populated.
    await runMatching(db, { importId: result.importId, user });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not import the workbook.",
    };
  }

  redirect("/donations");
}

export async function runMatchingAction() {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot run matching.");
  }
  const db = await getDb();
  const latest = await getLatestDonationImport(db);
  if (!latest) return;
  await runMatching(db, { importId: latest.id, user });
  revalidatePath("/donations", "layout");
}

export async function resolveTraceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot resolve traces.");
  }

  const traceId = String(formData.get("traceId") ?? "");
  const status = String(formData.get("status") ?? "") as TraceStatus;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!traceId || !(TRACE_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid trace update.");
  }

  const db = await getDb();
  await db
    .update(donationTrace)
    .set({
      status,
      manualOverride: true,
      matchMethod: "manual",
      confidence: status === "matched" ? 1 : 0,
      reviewedBy: user.id,
      notes,
      updatedAt: new Date(),
    })
    .where(eq(donationTrace.id, traceId));

  await writeAudit(db, {
    actor: user,
    action: "donations.resolve",
    entityType: "donation_trace",
    entityId: traceId,
    detail: { status, manual: true },
  });

  revalidatePath("/donations", "layout");
}

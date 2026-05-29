"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { writeAudit } from "@/lib/audit";
import {
  purgeImport,
  type ImportPurgeType,
} from "@/lib/import-purge";

export async function deleteImportAction(
  type: ImportPurgeType,
  importId: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser();

  if (type === "wellbeing") {
    if (!roleHasPermission(user.role, "impact.import")) {
      return { error: "Your role cannot delete wellbeing imports." };
    }
  } else if (!roleHasPermission(user.role, "donations.import")) {
    return { error: "Your role cannot delete donation imports." };
  }

  if (!importId.trim()) {
    return { error: "Import not found." };
  }

  try {
    const db = await getDb();
    const summary = await purgeImport(db, { type, importId });

    await writeAudit(db, {
      actor: user,
      action: type === "wellbeing" ? "impact.delete" : "donations.delete",
      entityType:
        type === "wellbeing"
          ? "impact_source_import"
          : "donation_source_import",
      entityId: importId,
      detail: { type, importId, summary },
    });

    revalidatePath("/import");
    revalidatePath("/donations");
    revalidatePath("/impact");
    revalidatePath("/wellbeing");
    if (type === "wellbeing") {
      revalidatePath(`/impact/review/${importId}`);
      revalidatePath(`/wellbeing/review/${importId}`);
    }

    return {};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete import.";
    return { error: message };
  }
}

import type { Database } from "@/db/client";
import {
  deleteDonationImport,
  type DonationPurgeSummary,
} from "./donation-purge";
import { deleteImpactImport, type ImpactPurgeSummary } from "./impact-purge";

export type ImportPurgeType = "wellbeing" | "donation";

export type PurgeSummary = DonationPurgeSummary | ImpactPurgeSummary;

export async function purgeImport(
  db: Database,
  options: {
    type: ImportPurgeType;
    importId: string;
  }
): Promise<PurgeSummary> {
  if (options.type === "donation") {
    return deleteDonationImport(db, options.importId);
  }
  return deleteImpactImport(db, options.importId);
}

export type { DonationPurgeSummary, ImpactPurgeSummary };

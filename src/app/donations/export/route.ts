import * as XLSX from "xlsx";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  buildImpactRecords,
  impactRecordToCsvRow,
} from "@/lib/close-the-loop/impact-export";
import {
  buildLedger,
  getLatestDonationImport,
} from "@/lib/close-the-loop/queries";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const db = await getDb();
  const latest = await getLatestDonationImport(db);
  if (!latest) return new Response("No donation data imported.", { status: 404 });

  // Partner-safe export always masks sensitive shelters, regardless of role.
  const ledger = await buildLedger(db, latest.id, {}, false);

  const records = buildImpactRecords(ledger).map(impactRecordToCsvRow);

  const worksheet = XLSX.utils.json_to_sheet(records);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  await writeAudit(db, {
    actor: user,
    action: "donations.export",
    entityType: "donation_source_import",
    entityId: latest.id,
    detail: { rows: records.length, scope: "partner_safe" },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="close-the-loop-impact.csv"',
    },
  });
}

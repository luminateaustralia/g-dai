import * as XLSX from "xlsx";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import {
  allocationLedgerToCsvRow,
  buildAllocationLedger,
} from "@/lib/donations-beta/queries";
import { getLatestAllocationRun } from "@/lib/donations-beta/run-allocation";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const db = await getDb();
  const latestImport = await getLatestDonationImport(db);
  if (!latestImport) {
    return new Response("No donation data imported.", { status: 404 });
  }

  const run = await getLatestAllocationRun(db, latestImport.id);
  if (!run) {
    return new Response("No allocation run found.", { status: 404 });
  }

  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");
  const ledger = await buildAllocationLedger(db, run.id, {}, canViewSensitive);
  const records = ledger.map(allocationLedgerToCsvRow);
  const worksheet = XLSX.utils.json_to_sheet(records);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  await writeAudit(db, {
    actor: user,
    action: "donations_beta.export",
    entityType: "allocation_run",
    entityId: run.id,
    detail: { rows: records.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="close-the-loop-allocation-ledger.csv"',
    },
  });
}

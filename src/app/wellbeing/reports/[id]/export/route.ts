import * as XLSX from "xlsx";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getReport } from "@/lib/impact-reporting/report-service";
import { buildReportView } from "@/lib/impact-reporting/report-view";
import { writeAudit } from "@/lib/audit";
import type { MetricRow } from "@/lib/impact-reporting/presentation";

function rowsToRecords(group: string, rows: MetricRow[]) {
  return rows.map((r) => ({
    Group: group,
    Metric: r.label,
    Category: r.category,
    Baseline: r.baseline,
    "3 Months": r.threeMo,
    "6 Months": r.sixMo,
    "Change (B-3m)": r.change3,
    "Change (B-6m)": r.change6,
    "n Baseline": r.nBaseline,
    "n 3 Months": r.n3,
    "n 6 Months": r.n6,
    Missing: r.missing,
  }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "impact.view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";

  const db = await getDb();
  const loaded = await getReport(db, id);
  if (!loaded) return new Response("Report not found", { status: 404 });

  const view = buildReportView(loaded);
  const records = [
    ...rowsToRecords("Overall", view.overallRows),
    ...view.cohortSections.flatMap((section) =>
      rowsToRecords(section.cohort.name, section.rows)
    ),
  ];

  const worksheet = XLSX.utils.json_to_sheet(records);
  const safeTitle = loaded.report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  await writeAudit(db, {
    actor: user,
    action: "impact.export",
    entityType: "impact_report",
    entityId: id,
    detail: { format },
  });

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Impact metrics");
    const buffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    }) as ArrayBuffer;
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeTitle}.xlsx"`,
      },
    });
  }

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}.csv"`,
    },
  });
}

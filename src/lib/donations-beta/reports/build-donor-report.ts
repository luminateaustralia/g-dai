import type { AllocationLedgerViewRow } from "@/lib/donations-beta/queries";
import { formatWeekLabel } from "@/lib/donations-beta/normalisation/weeks";
import { poolLabel, subtypeLabel } from "@/lib/donations-beta/normalisation/subtypes";
import type { AllocationPool } from "@/db/schema";

export type DonorReportLine = {
  weekId: string;
  weekLabel: string;
  pool: AllocationPool;
  poolLabel: string;
  productSubtype: string;
  productSubtypeLabel: string;
  donorOrderId: string | null;
  qtyAllocated: number;
  shelterName: string;
  shelterSuburb: string | null;
  shelterSensitive: boolean;
};

export type DonorImpactReport = {
  recipientKey: string;
  donorName: string;
  email: string | null;
  firstName: string | null;
  totalMeals: number;
  totalCarePacks: number;
  totalAllocated: number;
  orderIds: string[];
  lines: DonorReportLine[];
  weeks: string[];
};

function firstNameFromName(name: string): string | null {
  const part = name.trim().split(/\s+/)[0];
  return part || null;
}

function sensitiveShelterDescription(suburb: string | null, state?: string | null) {
  const region = suburb ?? state ?? "your region";
  return `a women's refuge in ${region}`;
}

export function shelterDescriptionForReport(
  row: Pick<
    AllocationLedgerViewRow,
    "shelterName" | "shelterSuburb" | "tooGoodGapFill" | "shelterSensitive"
  >,
  canViewSensitive: boolean
): string {
  if (row.tooGoodGapFill) return "Too Good covered the shortfall";
  if (row.shelterSensitive && !canViewSensitive) {
    return sensitiveShelterDescription(row.shelterSuburb);
  }
  if (row.shelterSuburb) return `${row.shelterName}, ${row.shelterSuburb}`;
  return row.shelterName;
}

export function buildDonorReports(
  ledger: AllocationLedgerViewRow[],
  canViewSensitive: boolean
): DonorImpactReport[] {
  const donorRows = ledger.filter(
    (row) => !row.tooGoodGapFill && row.donorEmail && row.qtyAllocatedThisWeek > 0
  );

  const grouped = new Map<string, AllocationLedgerViewRow[]>();
  for (const row of donorRows) {
    const key = row.donorEmail!.trim().toLowerCase();
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  return [...grouped.entries()]
    .map(([recipientKey, rows]) => {
      const donorName = rows[0].donorName ?? "Supporter";
      const lines: DonorReportLine[] = rows.map((row) => ({
        weekId: row.weekId,
        weekLabel: formatWeekLabel(row.weekId),
        pool: row.pool,
        poolLabel: poolLabel(row.pool),
        productSubtype: row.productSubtype,
        productSubtypeLabel: subtypeLabel(row.productSubtype),
        donorOrderId: row.donorOrderId,
        qtyAllocated: row.qtyAllocatedThisWeek,
        shelterName: shelterDescriptionForReport(
          {
            shelterName: row.shelterName,
            shelterSuburb: row.shelterSuburb,
            tooGoodGapFill: false,
            shelterSensitive: row.shelterSensitive,
          },
          canViewSensitive
        ),
        shelterSuburb: row.shelterSuburb,
        shelterSensitive: row.shelterSensitive && !canViewSensitive,
      }));

      const orderIds = [...new Set(rows.map((row) => row.donorOrderId).filter(Boolean))] as string[];
      const weeks = [...new Set(rows.map((row) => row.weekId))].sort();

      return {
        recipientKey,
        donorName,
        email: rows[0].donorEmail,
        firstName: firstNameFromName(donorName),
        totalMeals: rows
          .filter((row) => row.pool === "meal")
          .reduce((sum, row) => sum + row.qtyAllocatedThisWeek, 0),
        totalCarePacks: rows
          .filter((row) => row.pool === "care_pack")
          .reduce((sum, row) => sum + row.qtyAllocatedThisWeek, 0),
        totalAllocated: rows.reduce((sum, row) => sum + row.qtyAllocatedThisWeek, 0),
        orderIds,
        lines,
        weeks,
      };
    })
    .sort((a, b) => a.donorName.localeCompare(b.donorName));
}

export function findDonorReport(
  reports: DonorImpactReport[],
  recipientKey: string
): DonorImpactReport | null {
  const decoded = decodeURIComponent(recipientKey).toLowerCase();
  return reports.find((report) => report.recipientKey === decoded) ?? null;
}

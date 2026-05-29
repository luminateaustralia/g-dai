import { desc, eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  allocationCarryForward,
  allocationLedgerRow,
  allocationRun,
  allocationWeek,
  type AllocationPool,
} from "@/db/schema";
import { formatWeekLabel } from "@/lib/donations-beta/normalisation/weeks";
import {
  poolLabel,
  subtypeLabel,
} from "@/lib/donations-beta/normalisation/subtypes";
import { toShelterView } from "@/lib/close-the-loop/privacy";

export type AllocationLedgerViewRow = {
  id: string;
  weekId: string;
  weekLabel: string;
  pool: AllocationPool;
  poolLabel: string;
  productSubtype: string;
  productSubtypeLabel: string;
  donorOrderId: string | null;
  donorName: string | null;
  donorEmail: string | null;
  qtyDonated: number | null;
  qtyAllocatedThisWeek: number;
  carryForwardBalance: number | null;
  flexOrderId: string | null;
  shelterName: string;
  shelterSuburb: string | null;
  shelterSensitive: boolean;
  mealsFulfilled: number;
  tooGoodGapFill: boolean;
  gapQty: number;
};

export type AllocationLedgerFilters = {
  pool?: AllocationPool;
  weekId?: string;
  subtype?: string;
  gapOnly?: boolean;
  search?: string;
};

export type AllocationDashboardStats = {
  runId: string | null;
  importId: string | null;
  isDemo: boolean;
  totalAllocated: number;
  totalGap: number;
  carryForwardTotal: number;
  weekCount: number;
  ledgerRowCount: number;
  byPool: {
    meal: { allocated: number; gap: number; carryForward: number };
    care_pack: { allocated: number; gap: number; carryForward: number };
  };
};

function parseSummary(run: typeof allocationRun.$inferSelect | null): Omit<
  AllocationDashboardStats,
  "runId" | "importId" | "isDemo"
> | null {
  if (!run?.summaryJson) return null;
  try {
    const parsed = JSON.parse(run.summaryJson) as AllocationDashboardStats;
    return {
      totalAllocated: parsed.totalAllocated ?? 0,
      totalGap: parsed.totalGap ?? 0,
      carryForwardTotal: parsed.carryForwardTotal ?? 0,
      weekCount: parsed.weekCount ?? 0,
      ledgerRowCount: parsed.ledgerRowCount ?? 0,
      byPool: parsed.byPool ?? {
        meal: { allocated: 0, gap: 0, carryForward: 0 },
        care_pack: { allocated: 0, gap: 0, carryForward: 0 },
      },
    };
  } catch {
    return null;
  }
}

export async function getAllocationDashboardStats(
  db: Database,
  runId: string
): Promise<AllocationDashboardStats | null> {
  const [run] = await db
    .select()
    .from(allocationRun)
    .where(eq(allocationRun.id, runId))
    .limit(1);
  if (!run) return null;

  const summary = parseSummary(run);
  if (!summary) return null;

  return {
    runId: run.id,
    importId: run.importId,
    isDemo: run.isDemo,
    ...summary,
  };
}

export async function listAllocationWeeks(db: Database, runId: string) {
  return db
    .select()
    .from(allocationWeek)
    .where(eq(allocationWeek.runId, runId))
    .orderBy(allocationWeek.weekId);
}

export async function buildAllocationLedger(
  db: Database,
  runId: string,
  filters: AllocationLedgerFilters,
  canViewSensitive: boolean
): Promise<AllocationLedgerViewRow[]> {
  const rows = await db
    .select()
    .from(allocationLedgerRow)
    .where(eq(allocationLedgerRow.runId, runId))
    .orderBy(desc(allocationLedgerRow.weekId));

  const mapped = rows.map((row) => {
    const shelterView = toShelterView(
      {
        id: row.shelterId ?? row.id,
        companyName: row.shelterName,
        state: null,
        suburb: row.shelterSuburb,
        lga: null,
        postcode: null,
        sensitiveAddress: row.shelterSensitive,
        mealsEligible: null,
        carepackEligible: null,
      },
      canViewSensitive
    );

    return {
      id: row.id,
      weekId: row.weekId,
      weekLabel: formatWeekLabel(row.weekId),
      pool: row.pool,
      poolLabel: poolLabel(row.pool),
      productSubtype: row.productSubtype,
      productSubtypeLabel: subtypeLabel(row.productSubtype),
      donorOrderId: row.donorOrderId,
      donorName: row.donorName,
      donorEmail: row.donorEmail,
      qtyDonated: row.qtyDonated,
      qtyAllocatedThisWeek: row.qtyAllocatedThisWeek,
      carryForwardBalance: row.carryForwardBalance,
      flexOrderId: row.flexOrderId,
      shelterName: shelterView.displayName,
      shelterSuburb: shelterView.suburb,
      shelterSensitive: row.shelterSensitive,
      mealsFulfilled: row.mealsFulfilled,
      tooGoodGapFill: row.tooGoodGapFill,
      gapQty: row.gapQty,
    };
  });

  return mapped.filter((row) => {
    if (filters.pool && row.pool !== filters.pool) return false;
    if (filters.weekId && row.weekId !== filters.weekId) return false;
    if (filters.subtype && row.productSubtype !== filters.subtype) return false;
    if (filters.gapOnly && !row.tooGoodGapFill) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = [
        row.donorName,
        row.donorEmail,
        row.donorOrderId,
        row.shelterName,
        row.shelterSuburb,
        row.flexOrderId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export async function listCarryForward(
  db: Database,
  runId: string,
  weekId?: string
) {
  const rows = await db
    .select()
    .from(allocationCarryForward)
    .where(eq(allocationCarryForward.runId, runId));

  return rows.filter((row) => (weekId ? row.weekId === weekId : true));
}

export function allocationLedgerToCsvRow(row: AllocationLedgerViewRow) {
  return {
    Week: row.weekLabel,
    Pool: row.poolLabel,
    "Product subtype": row.productSubtypeLabel,
    "Donor order": row.donorOrderId ?? "",
    Donor: row.donorName ?? "",
    Email: row.donorEmail ?? "",
    "Qty donated": row.qtyDonated ?? "",
    "Qty allocated this week": row.qtyAllocatedThisWeek,
    "Carry-forward balance": row.carryForwardBalance ?? "",
    "Flex reference": row.flexOrderId ?? "",
    Shelter: row.shelterName,
    Suburb: row.shelterSuburb ?? "",
    Fulfilled: row.mealsFulfilled,
    "Too Good gap fill": row.tooGoodGapFill ? "Yes" : "No",
    "Gap quantity": row.gapQty,
  };
}

import { desc, eq, inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  allocationCarryForward,
  allocationLedgerRow,
  allocationRun,
  allocationWeek,
  customerOrder,
  donor,
  shelter,
  shelterDonationFulfilment,
} from "@/db/schema";
import { newId } from "@/lib/id";
import { d1InsertChunkSize } from "@/lib/db/d1-limits";
import { writeAudit } from "@/lib/audit";
import type { CurrentUser } from "@/lib/auth/session";
import { poolFromCategory } from "@/lib/donations-beta/normalisation/subtypes";
import { runAllocationEngine } from "@/lib/donations-beta/allocation/engine";
import type {
  FulfilmentInput,
  OrderInput,
} from "@/lib/donations-beta/allocation/types";

export type AllocationRunSummary = {
  runId: string;
  importId: string;
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

function donorDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string | null
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email || "Supporter";
}

async function loadAllocationInputs(db: Database, importId: string) {
  const [orders, fulfilments, shelters, donors] = await Promise.all([
    db.select().from(customerOrder).where(eq(customerOrder.importId, importId)),
    db
      .select()
      .from(shelterDonationFulfilment)
      .where(eq(shelterDonationFulfilment.importId, importId)),
    db.select().from(shelter).where(eq(shelter.importId, importId)),
    db.select().from(donor),
  ]);

  const donorById = new Map(donors.map((entry) => [entry.id, entry]));
  const shelterById = new Map(shelters.map((entry) => [entry.id, entry]));

  const orderInputs: OrderInput[] = [];
  for (const order of orders) {
    const pool = poolFromCategory(order.productCategory);
    if (!pool) continue;
    const donorRecord = order.donorId ? donorById.get(order.donorId) : undefined;
    orderInputs.push({
      internalId: order.id,
      orderId: order.orderId,
      donorName: donorDisplayName(
        donorRecord?.firstName ?? null,
        donorRecord?.lastName ?? null,
        donorRecord?.email ?? null
      ),
      donorEmail: donorRecord?.email ?? null,
      pool,
      totalQuantity: order.totalQuantity,
    });
  }

  const fulfilmentInputs: FulfilmentInput[] = [];
  for (const row of fulfilments) {
    const pool = poolFromCategory(row.productCategory);
    if (!pool) continue;
    const shelterRecord = row.shelterId ? shelterById.get(row.shelterId) : undefined;
    fulfilmentInputs.push({
      id: row.id,
      pool,
      product: row.product,
      quantity: row.quantity,
      status: row.status,
      fulfilmentDate: row.fulfilmentDate ?? row.dispatchDate,
      orderId: row.orderId,
      invoiceNo: row.invoiceNo,
      shelterId: row.shelterId,
      shelterName:
        shelterRecord?.companyName ?? row.companyNameRaw ?? "Unknown shelter",
      shelterSuburb: shelterRecord?.suburb ?? row.deliverySuburb,
      shelterSensitive: shelterRecord?.sensitiveAddress ?? false,
    });
  }

  return { orderInputs, fulfilmentInputs };
}

export async function getLatestAllocationRun(db: Database, importId?: string) {
  if (importId) {
    const rows = await db
      .select()
      .from(allocationRun)
      .where(eq(allocationRun.importId, importId))
      .orderBy(desc(allocationRun.startedAt))
      .limit(1);
    return rows[0] ?? null;
  }

  const rows = await db
    .select()
    .from(allocationRun)
    .orderBy(desc(allocationRun.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function runAllocationForImport(
  db: Database,
  options: {
    importId: string;
    user: CurrentUser;
    isDemo?: boolean;
  }
): Promise<AllocationRunSummary> {
  const existingRuns = await db
    .select({ id: allocationRun.id })
    .from(allocationRun)
    .where(eq(allocationRun.importId, options.importId));

  if (existingRuns.length) {
    const runIds = existingRuns.map((row) => row.id);
    await db
      .delete(allocationCarryForward)
      .where(inArray(allocationCarryForward.runId, runIds));
    await db
      .delete(allocationLedgerRow)
      .where(inArray(allocationLedgerRow.runId, runIds));
    await db.delete(allocationWeek).where(inArray(allocationWeek.runId, runIds));
    await db.delete(allocationRun).where(inArray(allocationRun.id, runIds));
  }

  const runId = newId();
  await db.insert(allocationRun).values({
    id: runId,
    importId: options.importId,
    status: "pending",
    isDemo: options.isDemo ?? false,
  });

  try {
    const { orderInputs, fulfilmentInputs } = await loadAllocationInputs(
      db,
      options.importId
    );
    const result = runAllocationEngine({
      orders: orderInputs,
      fulfilments: fulfilmentInputs,
    });

    const weekRows = result.weeks.map((week) => ({
      id: newId(),
      runId,
      pool: week.pool,
      weekId: week.weekId,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
    }));

    const ledgerRows = result.ledger.map((row) => ({
      id: row.allocationId,
      runId,
      weekId: row.weekId,
      pool: row.pool,
      productSubtype: row.productSubtype,
      donorOrderId: row.donorOrderId,
      donorName: row.donorName,
      donorEmail: row.donorEmail,
      qtyDonated: row.qtyDonated,
      qtyAllocatedThisWeek: row.qtyAllocatedThisWeek,
      carryForwardBalance: row.carryForwardBalance,
      flexOrderId: row.flexOrderId,
      shelterId: row.shelterId,
      shelterName: row.shelterName,
      shelterSuburb: row.shelterSuburb,
      shelterSensitive: row.shelterSensitive,
      mealsFulfilled: row.mealsFulfilled,
      tooGoodGapFill: row.tooGoodGapFill,
      gapQty: row.gapQty,
    }));

    const carryRows = result.carryForward.map((row) => ({
      id: newId(),
      runId,
      pool: row.pool,
      donorOrderId: row.donorOrderId,
      weekId: row.weekId,
      remainingQty: row.remainingQty,
    }));

    const ledgerChunk = d1InsertChunkSize(20);
    const weekChunk = d1InsertChunkSize(6);
    const carryChunk = d1InsertChunkSize(6);

    for (let i = 0; i < weekRows.length; i += weekChunk) {
      await db.insert(allocationWeek).values(weekRows.slice(i, i + weekChunk));
    }
    for (let i = 0; i < ledgerRows.length; i += ledgerChunk) {
      await db
        .insert(allocationLedgerRow)
        .values(ledgerRows.slice(i, i + ledgerChunk));
    }
    for (let i = 0; i < carryRows.length; i += carryChunk) {
      await db
        .insert(allocationCarryForward)
        .values(carryRows.slice(i, i + carryChunk));
    }

    const summary: AllocationRunSummary = {
      runId,
      importId: options.importId,
      totalAllocated: result.summary.totalAllocated,
      totalGap: result.summary.totalGap,
      carryForwardTotal: result.summary.carryForwardTotal,
      weekCount: result.weeks.length,
      ledgerRowCount: result.ledger.length,
      byPool: result.summary.byPool,
    };

    await db
      .update(allocationRun)
      .set({
        status: "completed",
        completedAt: new Date(),
        summaryJson: JSON.stringify(summary),
      })
      .where(eq(allocationRun.id, runId));

    await writeAudit(db, {
      actor: options.user,
      action: "donations_beta.allocate",
      entityType: "allocation_run",
      entityId: runId,
      detail: summary,
    });

    return summary;
  } catch (error) {
    await db
      .update(allocationRun)
      .set({
        status: "failed",
        completedAt: new Date(),
        summaryJson: JSON.stringify({
          error: error instanceof Error ? error.message : "Allocation failed",
        }),
      })
      .where(eq(allocationRun.id, runId));
    throw error;
  }
}

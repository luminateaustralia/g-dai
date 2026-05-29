import { newId } from "@/lib/id";
import { compareWeekIds } from "@/lib/donations-beta/normalisation/weeks";
import type { AllocationPool } from "@/db/schema";
import { groupDemandByWeekPool, prepareDemand } from "./prepare-demand";
import {
  allocateFromPool,
  cloneSupplyPools,
  prepareSupply,
  sortSupplyOrders,
} from "./prepare-supply";
import type {
  AllocationLedgerEntry,
  AllocationResult,
  CarryForwardSnapshot,
  FulfilmentInput,
  OrderInput,
} from "./types";

export function runAllocationEngine(input: {
  orders: OrderInput[];
  fulfilments: FulfilmentInput[];
}): AllocationResult {
  const demandBuckets = prepareDemand(input.fulfilments);
  const supplyPools = prepareSupply(input.orders);
  const workingPools = cloneSupplyPools(supplyPools);

  const ledger: AllocationLedgerEntry[] = [];
  const carryForward: CarryForwardSnapshot[] = [];
  const weekSet = new Map<string, AllocationResult["weeks"][number]>();

  const grouped = groupDemandByWeekPool(demandBuckets);
  const weekPoolKeys = [...grouped.keys()].sort((a, b) => {
    const [poolA, weekA] = a.split("|") as [AllocationPool, string];
    const [poolB, weekB] = b.split("|") as [AllocationPool, string];
    const weekCmp = compareWeekIds(weekA, weekB);
    if (weekCmp !== 0) return weekCmp;
    return poolA.localeCompare(poolB);
  });

  const summaryByPool: AllocationResult["summary"]["byPool"] = {
    meal: { allocated: 0, gap: 0, carryForward: 0 },
    care_pack: { allocated: 0, gap: 0, carryForward: 0 },
  };

  for (const key of weekPoolKeys) {
    const buckets = grouped.get(key) ?? [];
    if (buckets.length === 0) continue;

    const pool = buckets[0].pool;
    const weekId = buckets[0].weekId;
    const weekStart = buckets[0].weekStart;
    const weekEnd = buckets[0].weekEnd;

    weekSet.set(`${pool}|${weekId}`, { pool, weekId, weekStart, weekEnd });

    const poolOrders = workingPools.get(pool) ?? [];

    for (const bucket of buckets) {
      let remainingDemand = bucket.demandQty;
      const flexRef =
        bucket.flexOrderIds[0] ?? bucket.flexInvoiceNos[0] ?? null;

      const slices = allocateFromPool(poolOrders, remainingDemand);
      for (const slice of slices) {
        remainingDemand -= slice.qty;
        summaryByPool[pool].allocated += slice.qty;

        ledger.push({
          allocationId: newId(),
          weekId: bucket.weekId,
          weekStart: bucket.weekStart,
          weekEnd: bucket.weekEnd,
          pool: bucket.pool,
          productSubtype: bucket.subtype,
          donorOrderId: slice.order.orderId,
          donorName: slice.order.donorName,
          donorEmail: slice.order.donorEmail,
          qtyDonated: slice.order.qtyDonated,
          qtyAllocatedThisWeek: slice.qty,
          carryForwardBalance: slice.order.remainingQty,
          flexOrderId: flexRef,
          shelterId: bucket.shelterId,
          shelterName: bucket.shelterName,
          shelterSuburb: bucket.shelterSuburb,
          shelterSensitive: bucket.shelterSensitive,
          mealsFulfilled: slice.qty,
          tooGoodGapFill: false,
          gapQty: 0,
        });
      }

      if (remainingDemand > 0) {
        summaryByPool[pool].gap += remainingDemand;
        ledger.push({
          allocationId: newId(),
          weekId: bucket.weekId,
          weekStart: bucket.weekStart,
          weekEnd: bucket.weekEnd,
          pool: bucket.pool,
          productSubtype: bucket.subtype,
          donorOrderId: null,
          donorName: null,
          donorEmail: null,
          qtyDonated: null,
          qtyAllocatedThisWeek: 0,
          carryForwardBalance: null,
          flexOrderId: flexRef,
          shelterId: bucket.shelterId,
          shelterName: bucket.shelterName,
          shelterSuburb: bucket.shelterSuburb,
          shelterSensitive: bucket.shelterSensitive,
          mealsFulfilled: 0,
          tooGoodGapFill: true,
          gapQty: remainingDemand,
        });
      }
    }

    for (const order of sortSupplyOrders(poolOrders)) {
      if (order.remainingQty <= 0) continue;
      carryForward.push({
        pool,
        donorOrderId: order.orderId ?? order.internalId,
        weekId,
        remainingQty: order.remainingQty,
      });
    }
  }

  for (const pool of ["meal", "care_pack"] as const) {
    const remaining = (workingPools.get(pool) ?? []).reduce(
      (sum, order) => sum + Math.max(order.remainingQty, 0),
      0
    );
    summaryByPool[pool].carryForward = remaining;
  }

  const weeks = [...weekSet.values()].sort((a, b) => {
    const weekCmp = compareWeekIds(a.weekId, b.weekId);
    if (weekCmp !== 0) return weekCmp;
    return a.pool.localeCompare(b.pool);
  });

  const totalAllocated =
    summaryByPool.meal.allocated + summaryByPool.care_pack.allocated;
  const totalGap = summaryByPool.meal.gap + summaryByPool.care_pack.gap;
  const carryForwardTotal =
    summaryByPool.meal.carryForward + summaryByPool.care_pack.carryForward;

  return {
    ledger,
    carryForward,
    weeks,
    summary: {
      totalAllocated,
      totalGap,
      carryForwardTotal,
      byPool: summaryByPool,
    },
  };
}

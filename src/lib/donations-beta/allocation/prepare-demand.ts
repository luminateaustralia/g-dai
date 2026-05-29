import {
  isEligibleFulfilmentStatus,
  subtypeForProduct,
} from "@/lib/donations-beta/normalisation/subtypes";
import { weekBoundsFromIsoDate } from "@/lib/donations-beta/normalisation/weeks";
import type { AllocationPool } from "@/db/schema";
import type { FulfilmentInput, ShelterDemandBucket } from "./types";

function demandKey(
  weekId: string,
  shelterId: string,
  pool: AllocationPool,
  subtype: string
) {
  return `${weekId}|${shelterId}|${pool}|${subtype}`;
}

export function prepareDemand(
  fulfilments: FulfilmentInput[]
): ShelterDemandBucket[] {
  const buckets = new Map<string, ShelterDemandBucket>();

  for (const row of fulfilments) {
    if (!row.shelterId) continue;
    if (!isEligibleFulfilmentStatus(row.pool, row.status)) continue;
    if (!row.fulfilmentDate) continue;
    if (row.quantity === null || row.quantity <= 0) continue;

    const week = weekBoundsFromIsoDate(row.fulfilmentDate);
    if (!week) continue;

    const subtype = subtypeForProduct(row.pool, row.product);
    const key = demandKey(week.weekId, row.shelterId, row.pool, subtype);
    const existing = buckets.get(key);

    if (existing) {
      existing.demandQty += row.quantity;
      if (row.orderId && !existing.flexOrderIds.includes(row.orderId)) {
        existing.flexOrderIds.push(row.orderId);
      }
      if (row.invoiceNo && !existing.flexInvoiceNos.includes(row.invoiceNo)) {
        existing.flexInvoiceNos.push(row.invoiceNo);
      }
      continue;
    }

    buckets.set(key, {
      key,
      weekId: week.weekId,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      pool: row.pool,
      subtype,
      shelterId: row.shelterId,
      shelterName: row.shelterName,
      shelterSuburb: row.shelterSuburb,
      shelterSensitive: row.shelterSensitive,
      demandQty: row.quantity,
      flexOrderIds: row.orderId ? [row.orderId] : [],
      flexInvoiceNos: row.invoiceNo ? [row.invoiceNo] : [],
    });
  }

  return [...buckets.values()];
}

export function sortDemandBuckets(
  buckets: ShelterDemandBucket[]
): ShelterDemandBucket[] {
  return [...buckets].sort((a, b) => {
    const weekCmp = a.weekId.localeCompare(b.weekId);
    if (weekCmp !== 0) return weekCmp;
    if (a.pool !== b.pool) return a.pool.localeCompare(b.pool);
    if (b.demandQty !== a.demandQty) return b.demandQty - a.demandQty;
    return a.shelterName.localeCompare(b.shelterName);
  });
}

export function groupDemandByWeekPool(
  buckets: ShelterDemandBucket[]
): Map<string, ShelterDemandBucket[]> {
  const grouped = new Map<string, ShelterDemandBucket[]>();
  for (const bucket of sortDemandBuckets(buckets)) {
    const key = `${bucket.pool}|${bucket.weekId}`;
    const list = grouped.get(key) ?? [];
    list.push(bucket);
    grouped.set(key, list);
  }
  return grouped;
}

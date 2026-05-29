import type { AllocationPool } from "@/db/schema";
import type { DonorSupplyOrder, OrderInput } from "./types";

export function prepareSupply(orders: OrderInput[]): Map<AllocationPool, DonorSupplyOrder[]> {
  const pools = new Map<AllocationPool, DonorSupplyOrder[]>([
    ["meal", []],
    ["care_pack", []],
  ]);

  for (const order of orders) {
    if (order.totalQuantity === null || order.totalQuantity <= 0) continue;

    pools.get(order.pool)?.push({
      internalId: order.internalId,
      orderId: order.orderId,
      donorName: order.donorName,
      donorEmail: order.donorEmail,
      pool: order.pool,
      qtyDonated: order.totalQuantity,
      remainingQty: order.totalQuantity,
    });
  }

  for (const [pool, supply] of pools) {
    pools.set(pool, sortSupplyOrders(supply));
  }

  return pools;
}

export function sortSupplyOrders(orders: DonorSupplyOrder[]): DonorSupplyOrder[] {
  return [...orders].sort((a, b) => {
    if (b.remainingQty !== a.remainingQty) return b.remainingQty - a.remainingQty;
    return (a.orderId ?? a.internalId).localeCompare(b.orderId ?? b.internalId);
  });
}

export function cloneSupplyPools(
  pools: Map<AllocationPool, DonorSupplyOrder[]>
): Map<AllocationPool, DonorSupplyOrder[]> {
  const cloned = new Map<AllocationPool, DonorSupplyOrder[]>();
  for (const [pool, orders] of pools) {
    cloned.set(
      pool,
      orders.map((order) => ({ ...order }))
    );
  }
  return cloned;
}

export function findExactMatch(
  orders: DonorSupplyOrder[],
  demandQty: number
): DonorSupplyOrder | undefined {
  return orders.find((order) => order.remainingQty === demandQty);
}

export function allocateFromPool(
  orders: DonorSupplyOrder[],
  demandQty: number
): Array<{ order: DonorSupplyOrder; qty: number }> {
  let remainingDemand = demandQty;
  const slices: Array<{ order: DonorSupplyOrder; qty: number }> = [];

  const exact = findExactMatch(orders, remainingDemand);
  if (exact) {
    exact.remainingQty = 0;
    slices.push({ order: exact, qty: demandQty });
    return slices;
  }

  const sorted = sortSupplyOrders(orders.filter((o) => o.remainingQty > 0));
  for (const order of sorted) {
    if (remainingDemand <= 0) break;
    if (order.remainingQty <= 0) continue;

    const qty = Math.min(order.remainingQty, remainingDemand);
    order.remainingQty -= qty;
    remainingDemand -= qty;
    slices.push({ order, qty });
  }

  return slices;
}

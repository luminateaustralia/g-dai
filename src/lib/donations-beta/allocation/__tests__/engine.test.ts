import { describe, expect, it } from "vitest";

import { runAllocationEngine } from "../engine";
import type { FulfilmentInput, OrderInput } from "../types";

function order(partial: Partial<OrderInput> & Pick<OrderInput, "internalId" | "pool">): OrderInput {
  return {
    orderId: partial.orderId ?? partial.internalId,
    donorName: partial.donorName ?? "Donor",
    donorEmail: partial.donorEmail ?? null,
    totalQuantity: partial.totalQuantity ?? 10,
    ...partial,
  };
}

function fulfilment(
  partial: Partial<FulfilmentInput> & Pick<FulfilmentInput, "id" | "pool">
): FulfilmentInput {
  return {
    product: partial.product ?? "Donated Meal- FRESH",
    quantity: partial.quantity ?? 10,
    status: partial.status ?? (partial.pool === "meal" ? "Approved" : "Dispatched"),
    fulfilmentDate: partial.fulfilmentDate ?? "2026-01-20",
    orderId: partial.orderId ?? "1001",
    invoiceNo: partial.invoiceNo ?? null,
    shelterId: partial.shelterId ?? "shelter-1",
    shelterName: partial.shelterName ?? "Maplewood Welfare Services",
    shelterSuburb: partial.shelterSuburb ?? "Darlinghurst",
    shelterSensitive: partial.shelterSensitive ?? false,
    ...partial,
  };
}

describe("runAllocationEngine", () => {
  it("prioritises exact quantity matches before largest-first fill", () => {
    const result = runAllocationEngine({
      orders: [
        order({ internalId: "o1", orderId: "4001", totalQuantity: 50, pool: "meal" }),
        order({ internalId: "o2", orderId: "4002", totalQuantity: 15, pool: "meal" }),
      ],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 15,
          product: "Donated Meal- FRESH",
        }),
      ],
    });

    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0].donorOrderId).toBe("4002");
    expect(result.ledger[0].qtyAllocatedThisWeek).toBe(15);
  });

  it("fills demand using largest donor orders when no exact match exists", () => {
    const result = runAllocationEngine({
      orders: [
        order({ internalId: "o1", orderId: "4001", totalQuantity: 30, pool: "meal" }),
        order({ internalId: "o2", orderId: "4002", totalQuantity: 12, pool: "meal" }),
      ],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 20,
          product: "Donated Meal- FROZEN",
        }),
      ],
    });

    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0].donorOrderId).toBe("4001");
    expect(result.ledger[0].qtyAllocatedThisWeek).toBe(20);
    expect(result.ledger[0].carryForwardBalance).toBe(10);
  });

  it("carries forward partially used donor orders into a later week", () => {
    const result = runAllocationEngine({
      orders: [order({ internalId: "o1", orderId: "4001", totalQuantity: 30, pool: "meal" })],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 10,
          fulfilmentDate: "2026-01-20",
          product: "Donated Meal- FRESH",
        }),
        fulfilment({
          id: "f2",
          pool: "meal",
          quantity: 15,
          fulfilmentDate: "2026-01-27",
          product: "Donated Meal- FRESH",
        }),
      ],
    });

    expect(result.summary.carryForwardTotal).toBe(5);
    expect(result.carryForward.some((row) => row.remainingQty === 5)).toBe(true);
    expect(result.ledger.filter((row) => row.weekId.endsWith("W04"))).toHaveLength(1);
    expect(result.ledger.filter((row) => row.weekId.endsWith("W05"))).toHaveLength(1);
  });

  it("records Too Good gap fill when supply is insufficient", () => {
    const result = runAllocationEngine({
      orders: [order({ internalId: "o1", orderId: "4001", totalQuantity: 5, pool: "meal" })],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 20,
          product: "Donated Meal- FRESH",
        }),
      ],
    });

    expect(result.summary.totalGap).toBe(15);
    const gapRow = result.ledger.find((row) => row.tooGoodGapFill);
    expect(gapRow?.gapQty).toBe(15);
    expect(gapRow?.donorOrderId).toBeNull();
  });

  it("keeps meal and care pack pools separate", () => {
    const result = runAllocationEngine({
      orders: [
        order({ internalId: "o1", orderId: "4001", totalQuantity: 10, pool: "meal" }),
        order({ internalId: "o2", orderId: "5001", totalQuantity: 10, pool: "care_pack" }),
      ],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 10,
          product: "Donated Meal- FRESH",
        }),
        fulfilment({
          id: "f2",
          pool: "care_pack",
          quantity: 10,
          product: "DONATION - LOVE + CARE PACK",
          orderId: null,
          invoiceNo: "INV-1",
        }),
      ],
    });

    expect(result.ledger.every((row) => row.pool === "meal" || row.pool === "care_pack")).toBe(
      true
    );
    expect(result.ledger.find((row) => row.pool === "meal")?.donorOrderId).toBe("4001");
    expect(result.ledger.find((row) => row.pool === "care_pack")?.donorOrderId).toBe("5001");
  });

  it("does not merge like-for-like meal subtypes into one demand bucket", () => {
    const result = runAllocationEngine({
      orders: [order({ internalId: "o1", orderId: "4001", totalQuantity: 20, pool: "meal" })],
      fulfilments: [
        fulfilment({
          id: "f1",
          pool: "meal",
          quantity: 10,
          product: "Donated Meal- FRESH",
        }),
        fulfilment({
          id: "f2",
          pool: "meal",
          quantity: 8,
          product: "Donated Meal- FROZEN",
        }),
      ],
    });

    const subtypes = new Set(result.ledger.map((row) => row.productSubtype));
    expect(subtypes.has("fresh")).toBe(true);
    expect(subtypes.has("frozen")).toBe(true);
    expect(result.summary.totalGap).toBe(0);
  });
});

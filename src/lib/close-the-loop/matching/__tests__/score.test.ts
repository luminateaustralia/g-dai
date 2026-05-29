import { describe, expect, it } from "vitest";

import {
  scoreOrderToFulfilment,
  statusFromConfidence,
  type MatchableFulfilment,
  type MatchableOrder,
} from "../score";

const order: MatchableOrder = {
  id: "o1",
  productCategory: "meal",
  totalQuantity: 100,
  postcode: "2042",
};

const fulfilment: MatchableFulfilment = {
  id: "f1",
  productCategory: "meal",
  quantity: 100,
  postcode: "2042",
};

describe("scoreOrderToFulfilment", () => {
  it("scores inferred matches from category, postcode and quantity", () => {
    const result = scoreOrderToFulfilment(order, fulfilment);
    expect(result.method).toBe("category_qty_date_postcode");
    // 0.5 + 0.3 + 0.2 capped at 0.95
    expect(result.confidence).toBeCloseTo(0.95);
    expect(result.reasons.length).toBe(3);
  });

  it("scores category-only matches lower", () => {
    const result = scoreOrderToFulfilment(
      { ...order, postcode: "9999", totalQuantity: 5 },
      fulfilment
    );
    expect(result.confidence).toBeCloseTo(0.5);
  });

  it("returns no match when nothing aligns", () => {
    const result = scoreOrderToFulfilment(
      { ...order, productCategory: "care_pack", postcode: "9999", totalQuantity: 5 },
      fulfilment
    );
    expect(result.method).toBe("none");
    expect(result.confidence).toBe(0);
  });
});

describe("statusFromConfidence", () => {
  it("maps confidence bands to statuses", () => {
    expect(statusFromConfidence(1)).toBe("matched");
    expect(statusFromConfidence(0.7)).toBe("partial");
    expect(statusFromConfidence(0.4)).toBe("needs_review");
    expect(statusFromConfidence(0.1)).toBe("unmatched");
  });

  it("treats ambiguous inferred matches as needs review", () => {
    expect(statusFromConfidence(0.8, true)).toBe("needs_review");
  });
});

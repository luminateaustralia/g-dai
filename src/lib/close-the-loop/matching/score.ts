import type { DonationCategory, MatchMethod, TraceStatus } from "@/db/schema";

export type MatchableOrder = {
  id: string;
  productCategory: DonationCategory | null;
  totalQuantity: number | null;
  postcode: string | null;
};

export type MatchableFulfilment = {
  id: string;
  productCategory: DonationCategory | null;
  quantity: number | null;
  postcode: string | null;
};

export type ScoredMatch = {
  method: MatchMethod;
  confidence: number;
  reasons: string[];
};

/**
 * Scores how strongly a customer order matches a donated-item fulfilment from
 * overlapping attributes only. Order ID columns in customer orders and shelter
 * dispatch sheets are separate identifier spaces and are not compared.
 *
 * Note: the customer-orders source has no date column, so dates cannot contribute.
 */
export function scoreOrderToFulfilment(
  order: MatchableOrder,
  fulfilment: MatchableFulfilment
): ScoredMatch {
  const reasons: string[] = [];
  let confidence = 0;

  const categoryMatch =
    !!order.productCategory &&
    !!fulfilment.productCategory &&
    order.productCategory === fulfilment.productCategory;
  if (categoryMatch) {
    confidence += 0.5;
    reasons.push(`Product category match (${order.productCategory})`);
  }

  const postcodeMatch =
    !!order.postcode && !!fulfilment.postcode && order.postcode === fulfilment.postcode;
  if (postcodeMatch) {
    confidence += 0.3;
    reasons.push(`Postcode match (${order.postcode})`);
  }

  const quantityMatch =
    order.totalQuantity !== null &&
    fulfilment.quantity !== null &&
    order.totalQuantity === fulfilment.quantity;
  if (quantityMatch) {
    confidence += 0.2;
    reasons.push("Quantity match");
  }

  return {
    method: confidence > 0 ? "category_qty_date_postcode" : "none",
    confidence: Math.min(confidence, 0.95),
    reasons,
  };
}

export function statusFromConfidence(
  confidence: number,
  ambiguous = false
): TraceStatus {
  if (confidence >= 0.95) return "matched";
  if (ambiguous) return "needs_review";
  if (confidence >= 0.6) return "partial";
  if (confidence >= 0.3) return "needs_review";
  return "unmatched";
}

export const MIN_INFERRED_CONFIDENCE = 0.3;

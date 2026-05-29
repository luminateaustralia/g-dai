import { eq, inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  customerOrder,
  donationTrace,
  donationTraceMatchAttempt,
  shelterDonationFulfilment,
} from "@/db/schema";
import { newId } from "@/lib/id";
import { writeAudit } from "@/lib/audit";
import { d1InsertChunkSize } from "@/lib/db/d1-limits";
import { execInChunks, queryInChunks } from "@/lib/db/chunked-in";
import type { CurrentUser } from "@/lib/auth/session";
import {
  MIN_INFERRED_CONFIDENCE,
  scoreOrderToFulfilment,
  statusFromConfidence,
  type MatchableOrder,
} from "./score";

export type MatchingSummary = {
  fulfilments: number;
  matched: number;
  partial: number;
  needsReview: number;
  unmatched: number;
};

/**
 * Builds (or rebuilds) donation traces linking each donated-item fulfilment to
 * the customer order most likely to have funded it. Manually overridden traces
 * are preserved and never recomputed.
 */
export async function runMatching(
  db: Database,
  options: { importId: string; user: CurrentUser }
): Promise<MatchingSummary> {
  const orders = await db
    .select()
    .from(customerOrder)
    .where(eq(customerOrder.importId, options.importId));
  const fulfilments = await db
    .select()
    .from(shelterDonationFulfilment)
    .where(eq(shelterDonationFulfilment.importId, options.importId));

  const fulfilmentIds = fulfilments.map((f) => f.id);

  // Preserve any manual overrides; clear only the auto-generated traces.
  const existing = fulfilmentIds.length
    ? await queryInChunks(fulfilmentIds, (chunk) =>
        db
          .select()
          .from(donationTrace)
          .where(inArray(donationTrace.fulfilmentId, chunk))
      )
    : [];
  const overriddenFulfilmentIds = new Set(
    existing.filter((t) => t.manualOverride).map((t) => t.fulfilmentId)
  );
  const removableTraceIds = existing
    .filter((t) => !t.manualOverride)
    .map((t) => t.id);
  if (removableTraceIds.length) {
    await execInChunks(removableTraceIds, async (chunk) => {
      await db.delete(donationTrace).where(inArray(donationTrace.id, chunk));
      await db
        .delete(donationTraceMatchAttempt)
        .where(inArray(donationTraceMatchAttempt.traceId, chunk));
    });
  }

  const orderInputs: (MatchableOrder & { full: typeof orders[number] })[] =
    orders.map((o) => ({
      id: o.id,
      productCategory: o.productCategory ?? null,
      totalQuantity: o.totalQuantity,
      postcode: o.postcode,
      full: o,
    }));

  const summary: MatchingSummary = {
    fulfilments: fulfilments.length,
    matched: 0,
    partial: 0,
    needsReview: 0,
    unmatched: 0,
  };

  const traceRows: (typeof donationTrace.$inferInsert)[] = [];
  const attemptRows: (typeof donationTraceMatchAttempt.$inferInsert)[] = [];

  for (const fulfilment of fulfilments) {
    if (overriddenFulfilmentIds.has(fulfilment.id)) continue;

    const scored = orderInputs
      .map((order) => ({
        order,
        result: scoreOrderToFulfilment(order, {
          id: fulfilment.id,
          productCategory: fulfilment.productCategory ?? null,
          quantity: fulfilment.quantity,
          postcode: fulfilment.postcode,
        }),
      }))
      .filter((s) => s.result.confidence > 0)
      .sort((a, b) => b.result.confidence - a.result.confidence);

    const traceId = newId();

    const best = scored[0];

    // Log the strongest few attempts for explainability.
    for (const candidate of scored.slice(0, 3)) {
      attemptRows.push({
        id: newId(),
        traceId,
        fulfilmentId: fulfilment.id,
        candidateOrderId: candidate.order.id,
        method: candidate.result.method,
        confidence: candidate.result.confidence,
        accepted: candidate === best,
        detail: JSON.stringify(candidate.result.reasons),
      });
    }

    if (!best || best.result.confidence < MIN_INFERRED_CONFIDENCE) {
      traceRows.push({
        id: traceId,
        customerOrderId: null,
        fulfilmentId: fulfilment.id,
        shelterId: fulfilment.shelterId,
        status: "unmatched",
        matchMethod: "none",
        confidence: 0,
        sourceRecords: JSON.stringify({ fulfilmentId: fulfilment.id }),
      });
      summary.unmatched += 1;
      continue;
    }

    const topConfidence = best.result.confidence;
    const ambiguous =
      scored.filter((s) => s.result.confidence === topConfidence).length > 1;
    const status = statusFromConfidence(topConfidence, ambiguous);

    traceRows.push({
      id: traceId,
      customerOrderId: best.order.id,
      fulfilmentId: fulfilment.id,
      shelterId: fulfilment.shelterId,
      status,
      matchMethod: best.result.method,
      confidence: topConfidence,
      sourceRecords: JSON.stringify({
        fulfilmentId: fulfilment.id,
        orderId: best.order.id,
        reasons: best.result.reasons,
      }),
    });

    if (status === "matched") summary.matched += 1;
    else if (status === "partial") summary.partial += 1;
    else if (status === "needs_review") summary.needsReview += 1;
    else summary.unmatched += 1;
  }

  const traceChunk = d1InsertChunkSize(11);
  const attemptChunk = d1InsertChunkSize(9);

  for (let i = 0; i < traceRows.length; i += traceChunk) {
    await db.insert(donationTrace).values(traceRows.slice(i, i + traceChunk));
  }
  for (let i = 0; i < attemptRows.length; i += attemptChunk) {
    await db
      .insert(donationTraceMatchAttempt)
      .values(attemptRows.slice(i, i + attemptChunk));
  }

  await writeAudit(db, {
    actor: options.user,
    action: "donations.match",
    entityType: "donation_source_import",
    entityId: options.importId,
    detail: summary,
  });

  return summary;
}

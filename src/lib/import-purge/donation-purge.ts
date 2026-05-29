import { eq, inArray } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  customerOrder,
  donationSourceImport,
  donationTrace,
  donationTraceMatchAttempt,
  donor,
  shelter,
  shelterDonationFulfilment,
} from "@/db/schema";
import { execInChunks, queryInChunks } from "@/lib/db/chunked-in";

export type DonationPurgeSummary = {
  filename: string;
  traces: number;
  fulfilments: number;
  orders: number;
  shelters: number;
  donors: number;
};

export async function deleteDonationImport(
  db: Database,
  importId: string
): Promise<DonationPurgeSummary> {
  const [importRow] = await db
    .select()
    .from(donationSourceImport)
    .where(eq(donationSourceImport.id, importId));
  if (!importRow) {
    throw new Error("Import not found.");
  }

  const orders = await db
    .select({ id: customerOrder.id })
    .from(customerOrder)
    .where(eq(customerOrder.importId, importId));
  const fulfilments = await db
    .select({ id: shelterDonationFulfilment.id })
    .from(shelterDonationFulfilment)
    .where(eq(shelterDonationFulfilment.importId, importId));

  const orderIds = orders.map((o) => o.id);
  const fulfilmentIds = fulfilments.map((f) => f.id);

  const traceIdSet = new Set<string>();
  if (fulfilmentIds.length) {
    const byFulfilment = await queryInChunks(fulfilmentIds, (chunk) =>
      db
        .select({ id: donationTrace.id })
        .from(donationTrace)
        .where(inArray(donationTrace.fulfilmentId, chunk))
    );
    for (const row of byFulfilment) traceIdSet.add(row.id);
  }
  if (orderIds.length) {
    const byOrder = await queryInChunks(orderIds, (chunk) =>
      db
        .select({ id: donationTrace.id })
        .from(donationTrace)
        .where(inArray(donationTrace.customerOrderId, chunk))
    );
    for (const row of byOrder) traceIdSet.add(row.id);
  }
  const traceIds = [...traceIdSet];

  if (traceIds.length) {
    await execInChunks(traceIds, async (chunk) => {
      await db
        .delete(donationTraceMatchAttempt)
        .where(inArray(donationTraceMatchAttempt.traceId, chunk));
    });
  }
  if (fulfilmentIds.length) {
    await execInChunks(fulfilmentIds, async (chunk) => {
      await db
        .delete(donationTraceMatchAttempt)
        .where(inArray(donationTraceMatchAttempt.fulfilmentId, chunk));
    });
  }

  if (traceIds.length) {
    await execInChunks(traceIds, async (chunk) => {
      await db.delete(donationTrace).where(inArray(donationTrace.id, chunk));
    });
  }

  await db
    .delete(shelterDonationFulfilment)
    .where(eq(shelterDonationFulfilment.importId, importId));
  await db.delete(customerOrder).where(eq(customerOrder.importId, importId));
  await db.delete(shelter).where(eq(shelter.importId, importId));
  await db
    .delete(donationSourceImport)
    .where(eq(donationSourceImport.id, importId));

  const referencedDonors = await db
    .selectDistinct({ donorId: customerOrder.donorId })
    .from(customerOrder);
  const referencedIds = new Set(
    referencedDonors
      .map((r) => r.donorId)
      .filter((id): id is string => id != null)
  );
  const allDonors = await db.select({ id: donor.id }).from(donor);
  const orphanDonorIds = allDonors
    .map((d) => d.id)
    .filter((id) => !referencedIds.has(id));

  if (orphanDonorIds.length) {
    await execInChunks(orphanDonorIds, async (chunk) => {
      await db.delete(donor).where(inArray(donor.id, chunk));
    });
  }

  return {
    filename: importRow.filename,
    traces: traceIds.length,
    fulfilments: fulfilmentIds.length,
    orders: orderIds.length,
    shelters: importRow.shelterCount,
    donors: orphanDonorIds.length,
  };
}

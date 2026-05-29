import type { Database } from "@/db/client";
import {
  customerOrder,
  donationSourceImport,
  donor,
  shelter,
  shelterDonationFulfilment,
} from "@/db/schema";
import { d1InsertChunkSize } from "@/lib/db/d1-limits";
import { newId } from "@/lib/id";
import { writeAudit } from "@/lib/audit";
import { computeChecksum, readWorkbook } from "@/lib/ingestion/workbook";
import type { CurrentUser } from "@/lib/auth/session";
import {
  parseCarepakDonated,
  parseCustomerOrders,
  parseMealsDonated,
  parseShelters,
} from "./importers";
import { buildShelterLookups, resolveShelterId } from "./shelter-matching";

const SHELTER_CHUNK = d1InsertChunkSize(11);
const DONOR_CHUNK = d1InsertChunkSize(5);
const ORDER_CHUNK = d1InsertChunkSize(11);
const FULFILMENT_CHUNK = d1InsertChunkSize(18);

async function chunkedInsert<T>(
  rows: T[],
  chunkSize: number,
  insertChunk: (chunk: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insertChunk(rows.slice(i, i + chunkSize));
  }
}

export type DonationImportResult = {
  importId: string;
  orderCount: number;
  shelterCount: number;
  fulfilmentCount: number;
  unresolvedShelters: number;
};

export async function importDonationWorkbook(
  db: Database,
  options: { buffer: ArrayBuffer; filename: string; user: CurrentUser }
): Promise<DonationImportResult> {
  const wb = readWorkbook(options.buffer);
  const orders = parseCustomerOrders(wb);
  const shelters = parseShelters(wb);
  const fulfilments = [...parseMealsDonated(wb), ...parseCarepakDonated(wb)];
  const checksum = await computeChecksum(options.buffer);

  const importId = newId();
  await db.insert(donationSourceImport).values({
    id: importId,
    filename: options.filename,
    uploadedBy: options.user.id,
    checksum,
    orderCount: orders.length,
    shelterCount: shelters.length,
    fulfilmentCount: fulfilments.length,
  });

  // Shelters first so fulfilments can be linked on insert.
  const shelterRows = shelters.map((s) => ({ id: newId(), importId, ...s }));
  await chunkedInsert(shelterRows, SHELTER_CHUNK, (chunk) =>
    db.insert(shelter).values(chunk)
  );

  const shelterLookups = buildShelterLookups(
    shelterRows.map((row) => ({
      id: row.id,
      normalisedName: row.normalisedName,
      postcode: row.postcode,
    }))
  );

  // Deduplicate donors by email (or full name), then attach orders.
  const donorKeyToId = new Map<string, string>();
  const donorRows: (typeof donor.$inferInsert)[] = [];
  for (const order of orders) {
    const key =
      order.email?.toLowerCase() ??
      `${order.firstName ?? ""}|${order.lastName ?? ""}`.toLowerCase();
    if (!key.trim() || key === "|") continue;
    if (!donorKeyToId.has(key)) {
      const id = newId();
      donorKeyToId.set(key, id);
      donorRows.push({
        id,
        email: order.email,
        firstName: order.firstName,
        lastName: order.lastName,
      });
    }
  }
  await chunkedInsert(donorRows, DONOR_CHUNK, (chunk) =>
    db.insert(donor).values(chunk)
  );

  const orderRows = orders.map((o) => {
    const key =
      o.email?.toLowerCase() ??
      `${o.firstName ?? ""}|${o.lastName ?? ""}`.toLowerCase();
    return {
      id: newId(),
      importId,
      orderId: o.orderId,
      donorId: donorKeyToId.get(key) ?? null,
      product: o.product,
      productCategory: o.productCategory,
      totalQuantity: o.totalQuantity,
      suburb: o.suburb,
      state: o.state,
      postcode: o.postcode,
      rawData: o.rawData,
    };
  });
  await chunkedInsert(orderRows, ORDER_CHUNK, (chunk) =>
    db.insert(customerOrder).values(chunk)
  );

  let unresolvedShelters = 0;
  const fulfilmentRows = fulfilments.map((f) => {
    const shelterId = resolveShelterId(f, shelterLookups);
    if (!shelterId) unresolvedShelters += 1;
    return {
      id: newId(),
      importId,
      source: f.source,
      orderId: f.orderId,
      invoiceNo: f.invoiceNo,
      customerName: f.customerName,
      shelterId,
      companyNameRaw: f.shelterNameRaw,
      postcode: f.postcode,
      product: f.product,
      productCategory: f.productCategory,
      quantity: f.quantity,
      method: f.method,
      deliverySuburb: f.deliverySuburb,
      dispatchDate: f.dispatchDate,
      fulfilmentDate: f.fulfilmentDate,
      status: f.status,
      rawData: f.rawData,
    };
  });
  await chunkedInsert(fulfilmentRows, FULFILMENT_CHUNK, (chunk) =>
    db.insert(shelterDonationFulfilment).values(chunk)
  );

  await writeAudit(db, {
    actor: options.user,
    action: "donations.import",
    entityType: "donation_source_import",
    entityId: importId,
    detail: {
      filename: options.filename,
      orders: orders.length,
      shelters: shelters.length,
      fulfilments: fulfilments.length,
      unresolvedShelters,
    },
  });

  return {
    importId,
    orderCount: orders.length,
    shelterCount: shelters.length,
    fulfilmentCount: fulfilments.length,
    unresolvedShelters,
  };
}

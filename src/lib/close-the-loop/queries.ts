import { desc, eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  customerOrder,
  donationSourceImport,
  donationTrace,
  donationTraceMatchAttempt,
  donor,
  shelter,
  shelterDonationFulfilment,
  type CustomerOrder,
  type DonationTrace,
  type Donor,
  type Shelter,
  type ShelterDonationFulfilment,
  type TraceStatus,
} from "@/db/schema";
import { toShelterView, type ShelterView } from "./privacy";
import { parseTraceReasons } from "./matching/explain";
import { donationProductLabel } from "./normalisation";

export async function getLatestDonationImport(db: Database) {
  const rows = await db
    .select()
    .from(donationSourceImport)
    .orderBy(desc(donationSourceImport.uploadedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listDonationImports(db: Database) {
  return db
    .select()
    .from(donationSourceImport)
    .orderBy(desc(donationSourceImport.uploadedAt));
}

function donorName(d: Donor | undefined): string | null {
  if (!d) return null;
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return name || d.email || null;
}

export type LedgerRow = {
  traceId: string | null;
  fulfilmentId: string;
  source: string;
  product: string | null;
  productCategory: string | null;
  quantity: number | null;
  postcode: string | null;
  dispatchDate: string | null;
  fulfilmentDate: string | null;
  status: TraceStatus | "untraced";
  confidence: number;
  matchMethod: string | null;
  manualOverride: boolean;
  reasons: string[];
  donorId: string | null;
  donorName: string | null;
  shelter: ShelterView | null;
};

export type LedgerFilters = {
  search?: string;
  category?: string;
  status?: string;
  source?: string;
};

type DonationDataset = {
  importId: string;
  orders: CustomerOrder[];
  shelters: Shelter[];
  fulfilments: ShelterDonationFulfilment[];
  traces: DonationTrace[];
  donors: Donor[];
};

async function loadDataset(
  db: Database,
  importId: string
): Promise<DonationDataset> {
  const [orders, shelters, fulfilments, donors] = await Promise.all([
    db.select().from(customerOrder).where(eq(customerOrder.importId, importId)),
    db.select().from(shelter).where(eq(shelter.importId, importId)),
    db
      .select()
      .from(shelterDonationFulfilment)
      .where(eq(shelterDonationFulfilment.importId, importId)),
    db.select().from(donor),
  ]);
  const fulfilmentIds = new Set(fulfilments.map((f) => f.id));
  const allTraces = await db.select().from(donationTrace);
  const traces = allTraces.filter((t) =>
    t.fulfilmentId ? fulfilmentIds.has(t.fulfilmentId) : false
  );
  return { importId, orders, shelters, fulfilments, traces, donors };
}

export async function buildLedger(
  db: Database,
  importId: string,
  filters: LedgerFilters,
  canViewSensitive: boolean
): Promise<LedgerRow[]> {
  const data = await loadDataset(db, importId);
  const orderById = new Map(data.orders.map((o) => [o.id, o]));
  const donorById = new Map(data.donors.map((d) => [d.id, d]));
  const shelterById = new Map(data.shelters.map((s) => [s.id, s]));
  const traceByFulfilment = new Map(
    data.traces.map((t) => [t.fulfilmentId ?? "", t])
  );

  const rows: LedgerRow[] = data.fulfilments.map((f) => {
    const trace = traceByFulfilment.get(f.id);
    const order = trace?.customerOrderId
      ? orderById.get(trace.customerOrderId)
      : undefined;
    const donorRecord = order?.donorId
      ? donorById.get(order.donorId)
      : undefined;
    const shelterRecord = f.shelterId ? shelterById.get(f.shelterId) : undefined;

    return {
      traceId: trace?.id ?? null,
      fulfilmentId: f.id,
      source: f.source,
      product: f.product,
      productCategory: f.productCategory,
      quantity: f.quantity,
      postcode: f.postcode,
      dispatchDate: f.dispatchDate,
      fulfilmentDate: f.fulfilmentDate,
      status: trace?.status ?? "untraced",
      confidence: trace?.confidence ?? 0,
      matchMethod: trace?.matchMethod ?? null,
      manualOverride: trace?.manualOverride ?? false,
      reasons: parseTraceReasons(trace?.sourceRecords),
      donorId: order?.donorId ?? null,
      donorName: donorName(donorRecord),
      shelter: shelterRecord
        ? toShelterView(shelterRecord, canViewSensitive)
        : null,
    };
  });

  return rows.filter((row) => {
    if (filters.category && row.productCategory !== filters.category)
      return false;
    if (filters.source && row.source !== filters.source) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = [
        row.product,
        row.donorName,
        row.shelter?.displayName,
        row.postcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export type DonationStats = {
  orders: number;
  fulfilments: number;
  shelters: number;
  matched: number;
  partial: number;
  needsReview: number;
  unmatched: number;
  untraced: number;
};

export async function getDonationStats(
  db: Database,
  importId: string
): Promise<DonationStats> {
  const data = await loadDataset(db, importId);
  const tracedFulfilmentIds = new Set(
    data.traces.map((t) => t.fulfilmentId).filter(Boolean)
  );
  const byStatus = (status: TraceStatus) =>
    data.traces.filter((t) => t.status === status).length;

  return {
    orders: data.orders.length,
    fulfilments: data.fulfilments.length,
    shelters: data.shelters.length,
    matched: byStatus("matched"),
    partial: byStatus("partial"),
    needsReview: byStatus("needs_review"),
    unmatched: byStatus("unmatched"),
    untraced: data.fulfilments.filter((f) => !tracedFulfilmentIds.has(f.id))
      .length,
  };
}

export type DonationTypeSlice = {
  key: string;
  label: string;
  donations: number;
  quantity: number;
};

export type TopShelterDatum = {
  shelter: string;
  donations: number;
  quantity: number;
};

export type DonationImpactCharts = {
  byType: DonationTypeSlice[];
  topShelters: TopShelterDatum[];
  totalDonations: number;
  totalQuantity: number;
};

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getDonationImpactCharts(
  db: Database,
  importId: string,
  canViewSensitive: boolean
): Promise<DonationImpactCharts> {
  const data = await loadDataset(db, importId);

  const byTypeMap = new Map<string, { donations: number; quantity: number }>();
  const byShelter = new Map<string, { donations: number; quantity: number }>();

  for (const f of data.fulfilments) {
    const label = donationProductLabel(f.product, f.source);
    const typeEntry = byTypeMap.get(label) ?? { donations: 0, quantity: 0 };
    typeEntry.donations += 1;
    typeEntry.quantity += f.quantity ?? 0;
    byTypeMap.set(label, typeEntry);

    if (f.shelterId) {
      const shelterEntry = byShelter.get(f.shelterId) ?? {
        donations: 0,
        quantity: 0,
      };
      shelterEntry.donations += 1;
      shelterEntry.quantity += f.quantity ?? 0;
      byShelter.set(f.shelterId, shelterEntry);
    }
  }

  const byType: DonationTypeSlice[] = [...byTypeMap.entries()]
    .map(([label, value]) => ({
      key: slugify(label),
      label,
      donations: value.donations,
      quantity: value.quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const shelterById = new Map(data.shelters.map((s) => [s.id, s]));
  const topShelters: TopShelterDatum[] = [...byShelter.entries()]
    .map(([shelterId, value]) => {
      const record = shelterById.get(shelterId);
      const view = record ? toShelterView(record, canViewSensitive) : null;
      return {
        shelter: view?.displayName ?? "Unknown shelter",
        donations: value.donations,
        quantity: value.quantity,
      };
    })
    .sort((a, b) => b.donations - a.donations)
    .slice(0, 8);

  return {
    byType,
    topShelters,
    totalDonations: data.fulfilments.length,
    totalQuantity: data.fulfilments.reduce((sum, f) => sum + (f.quantity ?? 0), 0),
  };
}

export async function listShelters(
  db: Database,
  importId: string,
  canViewSensitive: boolean
): Promise<(ShelterView & { donationCount: number })[]> {
  const data = await loadDataset(db, importId);
  const countByShelter = new Map<string, number>();
  for (const f of data.fulfilments) {
    if (f.shelterId)
      countByShelter.set(
        f.shelterId,
        (countByShelter.get(f.shelterId) ?? 0) + 1
      );
  }
  return data.shelters.map((s) => ({
    ...toShelterView(s, canViewSensitive),
    donationCount: countByShelter.get(s.id) ?? 0,
  }));
}

export async function getShelterProfile(
  db: Database,
  shelterId: string,
  canViewSensitive: boolean
) {
  const rows = await db
    .select()
    .from(shelter)
    .where(eq(shelter.id, shelterId))
    .limit(1);
  const record = rows[0];
  if (!record) return null;

  const fulfilments = await db
    .select()
    .from(shelterDonationFulfilment)
    .where(eq(shelterDonationFulfilment.shelterId, shelterId));

  const totalQuantity = fulfilments.reduce((sum, f) => sum + (f.quantity ?? 0), 0);
  return {
    shelter: toShelterView(record, canViewSensitive),
    fulfilments,
    totalDonations: fulfilments.length,
    totalQuantity,
  };
}

export async function getDonorProfile(db: Database, donorId: string) {
  const rows = await db.select().from(donor).where(eq(donor.id, donorId)).limit(1);
  const record = rows[0];
  if (!record) return null;

  const orders = await db
    .select()
    .from(customerOrder)
    .where(eq(customerOrder.donorId, donorId));
  const orderIds = new Set(orders.map((o) => o.id));
  const allTraces = await db.select().from(donationTrace);
  const traces = allTraces.filter(
    (t) => t.customerOrderId && orderIds.has(t.customerOrderId)
  );

  return { donor: record, name: donorName(record), orders, traces };
}

export type QueueRow = LedgerRow;

export async function listReviewQueue(
  db: Database,
  importId: string,
  canViewSensitive: boolean
): Promise<QueueRow[]> {
  const ledger = await buildLedger(db, importId, {}, canViewSensitive);
  const needsAttention: (TraceStatus | "untraced")[] = [
    "needs_review",
    "partial",
    "unmatched",
    "untraced",
  ];
  return ledger.filter((row) => needsAttention.includes(row.status));
}

export async function getTraceDetail(
  db: Database,
  traceId: string,
  canViewSensitive: boolean
) {
  const rows = await db
    .select()
    .from(donationTrace)
    .where(eq(donationTrace.id, traceId))
    .limit(1);
  const trace = rows[0];
  if (!trace) return null;

  const fulfilment = trace.fulfilmentId
    ? (
        await db
          .select()
          .from(shelterDonationFulfilment)
          .where(eq(shelterDonationFulfilment.id, trace.fulfilmentId))
          .limit(1)
      )[0]
    : undefined;

  const order = trace.customerOrderId
    ? (
        await db
          .select()
          .from(customerOrder)
          .where(eq(customerOrder.id, trace.customerOrderId))
          .limit(1)
      )[0]
    : undefined;

  const donorRecord = order?.donorId
    ? (await db.select().from(donor).where(eq(donor.id, order.donorId)).limit(1))[0]
    : undefined;

  const shelterRecord = trace.shelterId
    ? (await db.select().from(shelter).where(eq(shelter.id, trace.shelterId)).limit(1))[0]
    : undefined;

  const attempts = await db
    .select()
    .from(donationTraceMatchAttempt)
    .where(eq(donationTraceMatchAttempt.traceId, traceId));

  return {
    trace,
    fulfilment,
    order,
    donorName: donorName(donorRecord),
    shelter: shelterRecord
      ? toShelterView(shelterRecord, canViewSensitive)
      : null,
    attempts,
  };
}

export { donorName };

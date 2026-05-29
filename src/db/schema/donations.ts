import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const DONATION_CATEGORIES = ["meal", "care_pack", "other"] as const;
export type DonationCategory = (typeof DONATION_CATEGORIES)[number];

export const FULFILMENT_SOURCES = ["meal", "carepak"] as const;
export type FulfilmentSource = (typeof FULFILMENT_SOURCES)[number];

export const TRACE_STATUSES = [
  "matched",
  "partial",
  "needs_review",
  "unmatched",
] as const;
export type TraceStatus = (typeof TRACE_STATUSES)[number];

export const MATCH_METHODS = [
  "exact_order_id",
  "category_qty_date_postcode",
  "shelter_product_date",
  "manual",
  "none",
] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

export const donationSourceImport = sqliteTable("donation_source_import", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  checksum: text("checksum"),
  orderCount: integer("order_count").notNull().default(0),
  shelterCount: integer("shelter_count").notNull().default(0),
  fulfilmentCount: integer("fulfilment_count").notNull().default(0),
  status: text("status").notNull().default("imported"),
  notes: text("notes"),
});

export const donor = sqliteTable("donor", {
  id: text("id").primaryKey(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const customerOrder = sqliteTable("customer_order", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull(),
  orderId: text("order_id"),
  donorId: text("donor_id"),
  product: text("product"),
  productCategory: text("product_category").$type<DonationCategory>(),
  totalQuantity: real("total_quantity"),
  suburb: text("suburb"),
  state: text("state"),
  postcode: text("postcode"),
  // Preserve the original row for full source lineage.
  rawData: text("raw_data"),
});

export const shelter = sqliteTable("shelter", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull(),
  companyName: text("company_name").notNull(),
  normalisedName: text("normalised_name").notNull(),
  state: text("state"),
  suburb: text("suburb"),
  lga: text("lga"),
  postcode: text("postcode"),
  mealsEligible: integer("meals_eligible", { mode: "boolean" }),
  carepackEligible: integer("carepack_eligible", { mode: "boolean" }),
  sensitiveAddress: integer("sensitive_address", { mode: "boolean" })
    .notNull()
    .default(false),
});

/**
 * Unified record of donated items dispatched to shelters, combining the meals
 * and care-pack source sheets. Original source identifiers are preserved.
 */
export const shelterDonationFulfilment = sqliteTable(
  "shelter_donation_fulfilment",
  {
    id: text("id").primaryKey(),
    importId: text("import_id").notNull(),
    source: text("source").$type<FulfilmentSource>().notNull(),
    orderId: text("order_id"),
    invoiceNo: text("invoice_no"),
    customerName: text("customer_name"),
    shelterId: text("shelter_id"),
    companyNameRaw: text("company_name_raw"),
    postcode: text("postcode"),
    product: text("product"),
    productCategory: text("product_category").$type<DonationCategory>(),
    quantity: real("quantity"),
    method: text("method"),
    deliverySuburb: text("delivery_suburb"),
    dispatchDate: text("dispatch_date"),
    fulfilmentDate: text("fulfilment_date"),
    status: text("status"),
    rawData: text("raw_data"),
  }
);

/**
 * Donor/order -> donated product -> shelter trace. Stores match method,
 * confidence and the source records used so inferred matches are explainable.
 */
export const donationTrace = sqliteTable("donation_trace", {
  id: text("id").primaryKey(),
  customerOrderId: text("customer_order_id"),
  fulfilmentId: text("fulfilment_id"),
  shelterId: text("shelter_id"),
  status: text("status").$type<TraceStatus>().notNull(),
  matchMethod: text("match_method").$type<MatchMethod>().notNull(),
  confidence: real("confidence").notNull().default(0),
  sourceRecords: text("source_records"),
  manualOverride: integer("manual_override", { mode: "boolean" })
    .notNull()
    .default(false),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const donationTraceMatchAttempt = sqliteTable(
  "donation_trace_match_attempt",
  {
    id: text("id").primaryKey(),
    traceId: text("trace_id"),
    fulfilmentId: text("fulfilment_id"),
    candidateOrderId: text("candidate_order_id"),
    method: text("method").$type<MatchMethod>().notNull(),
    confidence: real("confidence").notNull().default(0),
    accepted: integer("accepted", { mode: "boolean" }).notNull().default(false),
    detail: text("detail"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  }
);

export type Donor = typeof donor.$inferSelect;
export type CustomerOrder = typeof customerOrder.$inferSelect;
export type Shelter = typeof shelter.$inferSelect;
export type ShelterDonationFulfilment =
  typeof shelterDonationFulfilment.$inferSelect;
export type DonationTrace = typeof donationTrace.$inferSelect;
export type DonationSourceImport = typeof donationSourceImport.$inferSelect;
export type DonationTraceMatchAttempt =
  typeof donationTraceMatchAttempt.$inferSelect;

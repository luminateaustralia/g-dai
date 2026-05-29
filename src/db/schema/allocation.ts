import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const ALLOCATION_POOLS = ["meal", "care_pack"] as const;
export type AllocationPool = (typeof ALLOCATION_POOLS)[number];

export const ALLOCATION_RUN_STATUSES = [
  "pending",
  "completed",
  "failed",
] as const;
export type AllocationRunStatus = (typeof ALLOCATION_RUN_STATUSES)[number];

export const allocationRun = sqliteTable("allocation_run", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull(),
  status: text("status").$type<AllocationRunStatus>().notNull().default("pending"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  summaryJson: text("summary_json"),
});

export const allocationWeek = sqliteTable("allocation_week", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  pool: text("pool").$type<AllocationPool>().notNull(),
  weekId: text("week_id").notNull(),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
});

export const allocationLedgerRow = sqliteTable("allocation_ledger_row", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  weekId: text("week_id").notNull(),
  pool: text("pool").$type<AllocationPool>().notNull(),
  productSubtype: text("product_subtype").notNull(),
  donorOrderId: text("donor_order_id"),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  qtyDonated: real("qty_donated"),
  qtyAllocatedThisWeek: real("qty_allocated_this_week").notNull().default(0),
  carryForwardBalance: real("carry_forward_balance"),
  flexOrderId: text("flex_order_id"),
  shelterId: text("shelter_id"),
  shelterName: text("shelter_name").notNull(),
  shelterSuburb: text("shelter_suburb"),
  shelterSensitive: integer("shelter_sensitive", { mode: "boolean" })
    .notNull()
    .default(false),
  mealsFulfilled: real("meals_fulfilled").notNull().default(0),
  tooGoodGapFill: integer("too_good_gap_fill", { mode: "boolean" })
    .notNull()
    .default(false),
  gapQty: real("gap_qty").notNull().default(0),
});

export const allocationCarryForward = sqliteTable("allocation_carry_forward", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  pool: text("pool").$type<AllocationPool>().notNull(),
  donorOrderId: text("donor_order_id").notNull(),
  weekId: text("week_id").notNull(),
  remainingQty: real("remaining_qty").notNull(),
});

export type AllocationRun = typeof allocationRun.$inferSelect;
export type AllocationWeek = typeof allocationWeek.$inferSelect;
export type AllocationLedgerRow = typeof allocationLedgerRow.$inferSelect;
export type AllocationCarryForward = typeof allocationCarryForward.$inferSelect;

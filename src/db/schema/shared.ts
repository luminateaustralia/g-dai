import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Stubbed role-based access control. Roles are modelled in data so the
 * permission model is real, even though authentication itself is a prototype
 * cookie-based role switcher for the hack-day build.
 */
export const APP_ROLES = ["admin", "impact_analyst", "ops", "viewer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const appUser = sqliteTable("app_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<AppRole>().notNull().default("viewer"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Append-only audit trail for imports, transformations and generated outputs.
 * Required for the auditability non-functional requirement of both PRDs.
 */
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AppUser = typeof appUser.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

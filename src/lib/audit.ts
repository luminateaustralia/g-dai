import type { Database } from "@/db/client";
import { auditLog } from "@/db/schema";
import { newId } from "@/lib/id";
import type { CurrentUser } from "@/lib/auth/session";

export type AuditInput = {
  actor?: Pick<CurrentUser, "id" | "role"> | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: unknown;
};

/** Writes an append-only audit entry. Never throws into the caller's flow. */
export async function writeAudit(db: Database, input: AuditInput) {
  try {
    await db.insert(auditLog).values({
      id: newId(),
      actorId: input.actor?.id ?? null,
      actorRole: input.actor?.role ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      detail:
        input.detail === undefined ? null : JSON.stringify(input.detail),
    });
  } catch (error) {
    console.error("Failed to write audit entry", error);
  }
}

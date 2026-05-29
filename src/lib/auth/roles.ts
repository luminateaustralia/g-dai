import type { AppRole } from "@/db/schema";

export type Permission =
  | "impact.view"
  | "impact.import"
  | "impact.generate"
  | "impact.config"
  | "donations.view"
  | "donations.import"
  | "donations.resolve"
  | "donations.view_sensitive"
  | "admin.manage"
  | "ai.run";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    "impact.view",
    "impact.import",
    "impact.generate",
    "impact.config",
    "donations.view",
    "donations.import",
    "donations.resolve",
    "donations.view_sensitive",
    "admin.manage",
    "ai.run",
  ],
  impact_analyst: [
    "impact.view",
    "impact.import",
    "impact.generate",
    "impact.config",
    "donations.view",
    "ai.run",
  ],
  ops: [
    "donations.view",
    "donations.import",
    "donations.resolve",
    "donations.view_sensitive",
    "impact.view",
  ],
  viewer: ["impact.view", "donations.view"],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  impact_analyst: "Impact analyst",
  ops: "Operations",
  viewer: "Viewer",
};

export function roleHasPermission(role: AppRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

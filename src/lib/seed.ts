import { sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { appUser, impactMetricDefinition, APP_ROLES } from "@/db/schema";
import { D1_MAX_PARAMS } from "@/lib/db/d1-limits";
import { METRIC_DEFINITIONS } from "@/lib/impact-reporting/metrics/definitions";

const DEMO_USERS = [
  { id: "user-admin", name: "Avery Admin", email: "avery.admin@twogood.example", role: "admin" },
  { id: "user-impact", name: "Imogen Impact", email: "imogen.impact@twogood.example", role: "impact_analyst" },
  { id: "user-ops", name: "Olivia Ops", email: "olivia.ops@twogood.example", role: "ops" },
  { id: "user-viewer", name: "Vic Viewer", email: "vic.viewer@twogood.example", role: "viewer" },
] as const;

let seeded = false;

/**
 * Idempotently seeds configurable metric definitions and the prototype demo
 * users. Safe to call on every request; only performs work once per worker
 * instance, and uses upserts so re-runs are harmless.
 */
const METRIC_DEFINITION_COLUMNS = 12;

export async function ensureSeeded(db: Database): Promise<void> {
  if (seeded) return;

  const metricRows = METRIC_DEFINITIONS.map((m, index) => ({
    key: m.key,
    label: m.label,
    fullQuestion: m.fullQuestion,
    domain: m.domain,
    category: m.category,
    scaleType: m.scaleType,
    scaleMin: m.scaleMin,
    scaleMax: m.scaleMax,
    missingValues: JSON.stringify(m.missingValues),
    higherIsBetter: m.higherIsBetter,
    sortOrder: index,
    active: true,
  }));

  const metricBatchSize = Math.floor(D1_MAX_PARAMS / METRIC_DEFINITION_COLUMNS);

  for (let i = 0; i < metricRows.length; i += metricBatchSize) {
    await db
      .insert(impactMetricDefinition)
      .values(metricRows.slice(i, i + metricBatchSize))
      .onConflictDoUpdate({
        target: impactMetricDefinition.key,
        set: {
          label: sqlExcluded("label"),
          fullQuestion: sqlExcluded("full_question"),
          domain: sqlExcluded("domain"),
          category: sqlExcluded("category"),
          scaleType: sqlExcluded("scale_type"),
          scaleMin: sqlExcluded("scale_min"),
          scaleMax: sqlExcluded("scale_max"),
          missingValues: sqlExcluded("missing_values"),
          higherIsBetter: sqlExcluded("higher_is_better"),
          sortOrder: sqlExcluded("sort_order"),
        },
      });
  }

  await db
    .insert(appUser)
    .values(
      DEMO_USERS.filter((u) =>
        (APP_ROLES as readonly string[]).includes(u.role)
      ).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    )
    .onConflictDoNothing();

  seeded = true;
}

function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

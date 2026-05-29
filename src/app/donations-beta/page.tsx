import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import {
  getAllocationDashboardStats,
  listAllocationWeeks,
} from "@/lib/donations-beta/queries";
import { getLatestAllocationRun } from "@/lib/donations-beta/run-allocation";
import {
  LoadDemoScenarioButton,
  RunAllocationButton,
} from "@/components/donations-beta/allocation-actions";
import { GapStatCard } from "@/components/donations-beta/gap-marketing-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { poolLabel } from "@/lib/donations-beta/normalisation/subtypes";
import { formatWeekLabel } from "@/lib/donations-beta/normalisation/weeks";

export const dynamic = "force-dynamic";

export default async function DonationsBetaPage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const canImport = roleHasPermission(user.role, "donations.import");
  const canRun = roleHasPermission(user.role, "donations.resolve");

  const latestImport = await getLatestDonationImport(db);
  const run = latestImport
    ? await getLatestAllocationRun(db, latestImport.id)
    : null;
  const stats = run ? await getAllocationDashboardStats(db, run.id) : null;
  const weeks = run ? await listAllocationWeeks(db, run.id) : [];

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Impact (Beta)
          </h1>
          <Badge variant="secondary">Weekly allocation</Badge>
        </div>
        <p className="text-muted-foreground">
          Close the Loop beta: weekly donor-to-shelter allocation with
          carry-forward balances, gap tracking, and donor impact reports.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <LoadDemoScenarioButton disabled={!canImport} />
        {latestImport ? (
          <RunAllocationButton disabled={!canRun} importId={latestImport.id} />
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocation summary</CardTitle>
            <CardDescription>
              {latestImport
                ? `Latest import: ${latestImport.filename}`
                : "No import loaded yet."}
              {run?.isDemo ? " · Demo scenario" : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Allocated" value={stats.totalAllocated} />
                <GapStatCard stats={stats} />
                <Stat label="Carry-forward" value={stats.carryForwardTotal} />
                <Stat label="Weeks" value={stats.weekCount} />
                <Stat label="Ledger rows" value={stats.ledgerRowCount} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Load the demo scenario or{" "}
                <Link href="/import" className="text-primary underline-offset-4 hover:underline">
                  import a workbook
                </Link>
                , then run allocation.
              </p>
            )}
          </CardContent>
        </Card>

        {stats ? (
          <Card>
            <CardHeader>
              <CardTitle>By pool</CardTitle>
              <CardDescription>
                Meals and care packs are allocated separately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["meal", "care_pack"] as const).map((pool) => (
                <div key={pool} className="rounded-lg border p-3">
                  <p className="font-medium">{poolLabel(pool)}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-medium">{stats.byPool[pool].allocated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gap</p>
                      <p className="font-medium">{stats.byPool[pool].gap}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carry-forward</p>
                      <p className="font-medium">
                        {stats.byPool[pool].carryForward}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {weeks.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Matching weeks</CardTitle>
            <CardDescription>
              Weekly cycles derived from Flex fulfilment dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {weeks.map((week) => (
                <li
                  key={week.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{formatWeekLabel(week.weekId)}</p>
                  <p className="text-muted-foreground">{poolLabel(week.pool)}</p>
                  <p className="text-xs text-muted-foreground">
                    {week.weekStart} to {week.weekEnd}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/donations-beta/ledger"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                View allocation ledger
              </Link>
              <Link
                href="/donations-beta/reports"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                View donor reports
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

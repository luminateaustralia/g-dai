import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { ensureSeeded } from "@/lib/seed";
import {
  getDonationImpactCharts,
  getDonationStats,
  getLatestDonationImport,
} from "@/lib/close-the-loop/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MatchingWorkflowGuide } from "@/components/donations/matching-workflow-guide";
import { RunMatchingButton } from "@/components/donations/run-matching-button";
import {
  DonationTypeChart,
  TopSheltersChart,
} from "@/components/donations/impact-charts";

export const dynamic = "force-dynamic";

export default async function DonationsPage() {
  const db = await getDb();
  await ensureSeeded(db);
  const user = await getCurrentUser();
  const canResolve = roleHasPermission(user.role, "donations.resolve");
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");

  const latest = await getLatestDonationImport(db);
  const stats = latest ? await getDonationStats(db, latest.id) : null;
  const charts = latest
    ? await getDonationImpactCharts(db, latest.id, canViewSensitive)
    : null;

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Impact
        </h1>
        <p className="text-muted-foreground">
          Track donation impact by tracing donor orders through to the shelters
          that received donated meals and care packs.
        </p>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Impact summary</CardTitle>
            <CardDescription>
              {latest
                ? `Latest import: ${latest.filename}`
                : "No data imported yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Orders" value={stats.orders} />
                <Stat label="Donations" value={stats.fulfilments} />
                <Stat label="Shelters" value={stats.shelters} />
                <Stat label="Confirmed" value={stats.matched} />
                <Stat label="Likely" value={stats.partial} />
                <Stat label="Needs review" value={stats.needsReview} />
                <Stat label="Unmatched" value={stats.unmatched} />
                <Stat label="Untraced" value={stats.untraced} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/import" className="text-primary underline-offset-4 hover:underline">
                  Import a workbook
                </Link>{" "}
                to see impact metrics.
              </p>
            )}
            {latest ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <RunMatchingButton disabled={!canResolve} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {charts && charts.totalDonations > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What was delivered</CardTitle>
              <CardDescription>
                Items delivered by product type across this import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {charts.byType.length > 0 ? (
                <DonationTypeChart
                  data={charts.byType}
                  totalQuantity={charts.totalQuantity}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No donations recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where impact landed</CardTitle>
              <CardDescription>
                Shelters that received the most donations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {charts.topShelters.length > 0 ? (
                <TopSheltersChart data={charts.topShelters} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No shelters matched to donations yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="mt-6">
        <MatchingWorkflowGuide />
      </div>
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}


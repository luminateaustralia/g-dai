import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Heart,
  Route,
  Upload,
  AlertCircle,
} from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import {
  DonationTypeChart,
  TopSheltersChart,
} from "@/components/donations/impact-charts";
import { ChangeChart } from "@/components/impact/charts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  getDonationImpactCharts,
  getDonationStats,
  getLatestDonationImport,
} from "@/lib/close-the-loop/queries";
import { loadAllReports } from "@/lib/impact-reporting/report-service";
import { buildWellbeingDashboard } from "@/lib/impact-reporting/report-view";
import {
  PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL,
  PERSONAL_WELLBEING_INDEX_LABEL,
} from "@/lib/impact-reporting/metrics/definitions";
import { formatChange, formatScore } from "@/lib/impact-reporting/presentation";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(value);
}

export default async function Home() {
  const db = await getDb();
  await ensureSeeded(db);
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(
    user.role,
    "donations.view_sensitive"
  );

  const latestImport = await getLatestDonationImport(db);
  const donationStats = latestImport
    ? await getDonationStats(db, latestImport.id)
    : null;
  const donationCharts = latestImport
    ? await getDonationImpactCharts(db, latestImport.id, canViewSensitive)
    : null;

  const reports = await loadAllReports(db);
  const wellbeing = buildWellbeingDashboard(reports);
  const wellbeingLatest = wellbeing.latest;

  const needsAttention = donationStats
    ? donationStats.partial +
      donationStats.needsReview +
      donationStats.unmatched +
      donationStats.untraced
    : 0;
  const confirmedRate =
    donationStats && donationStats.fulfilments > 0
      ? Math.round((donationStats.matched / donationStats.fulfilments) * 100)
      : null;

  return (
    <PageLayout className="py-10" showBreadcrumbs={false}>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Close the Loop
        </h1>
        <p className="max-w-3xl text-muted-foreground text-pretty">
          Your overview of donation impact traceability and{" "}
          {PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL} outcomes. Jump into
          either area below for the full workflow.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          label="Donations traced"
          value={
            confirmedRate === null ? "—" : `${confirmedRate}% confirmed`
          }
          hint={
            donationStats
              ? `${donationStats.matched.toLocaleString("en-AU")} of ${donationStats.fulfilments.toLocaleString("en-AU")} donations`
              : "Import impact data to begin"
          }
          href={donationStats ? "/donations" : "/import"}
        />
        <OverviewStat
          label="Items delivered"
          value={
            donationCharts?.totalQuantity
              ? donationCharts.totalQuantity.toLocaleString("en-AU")
              : "—"
          }
          hint={
            donationStats
              ? `${donationStats.shelters.toLocaleString("en-AU")} shelters reached`
              : undefined
          }
          href="/donations"
        />
        <OverviewStat
          label={`${PERSONAL_WELLBEING_INDEX_LABEL} (6 mo)`}
          value={
            wellbeingLatest
              ? formatScore(wellbeingLatest.view.stats.pwiSixMo)
              : "—"
          }
          hint={
            wellbeingLatest
              ? `${formatChange(wellbeingLatest.view.stats.pwiChange)} vs baseline`
              : "Generate a wellbeing report"
          }
          href="/wellbeing"
        />
        <OverviewStat
          label="Programme clients"
          value={
            wellbeingLatest
              ? wellbeingLatest.view.stats.clients.toLocaleString("en-AU")
              : "—"
          }
          hint={
            wellbeingLatest?.period
              ? `Latest period: ${wellbeingLatest.period.label}`
              : undefined
          }
          href="/wellbeing"
        />
      </section>

      {needsAttention > 0 ? (
        <Card className="mt-6 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="text-sm font-medium">
                  {needsAttention.toLocaleString("en-AU")} donations need
                  attention
                </p>
                <p className="text-sm text-muted-foreground">
                  Review likely matches, unmatched rows, or untraced fulfilments
                  in the ledger.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              render={
                <Link href="/donations/ledger?view=needs_attention">
                  Review ledger
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Route className="size-4 text-primary" />
                  Impact
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Trace donor orders through to the shelters that received
                  meals and care packs.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href="/donations">
                    Open dashboard
                    <ArrowRight />
                  </Link>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {donationStats ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat label="Orders" value={donationStats.orders} />
                  <MiniStat
                    label="Donations"
                    value={donationStats.fulfilments}
                  />
                  <MiniStat label="Confirmed" value={donationStats.matched} />
                  <MiniStat label="Untraced" value={donationStats.untraced} />
                </div>
                {donationCharts && donationCharts.byType.length > 0 ? (
                  <DonationTypeChart
                    data={donationCharts.byType}
                    totalQuantity={donationCharts.totalQuantity}
                  />
                ) : null}
                {donationCharts && donationCharts.topShelters.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Top shelters by donations
                    </p>
                    <TopSheltersChart
                      data={donationCharts.topShelters.slice(0, 5)}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyPanel
                message="No donation data imported yet."
                actionLabel="Import a workbook"
                actionHref="/import"
              />
            )}
            {latestImport ? (
              <p className="text-xs text-muted-foreground">
                Latest import: {latestImport.filename} ·{" "}
                {formatDate(latestImport.uploadedAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="size-4 text-primary" />
                  Wellbeing
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Review {PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL} data
                  and track domain movement across reporting periods.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href="/wellbeing">
                    Open dashboard
                    <ArrowRight />
                  </Link>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {wellbeingLatest ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat
                    label="Clients"
                    value={wellbeingLatest.view.stats.clients}
                  />
                  <MiniStat
                    label="Completion"
                    value={
                      wellbeingLatest.view.stats.completedProgramPct ?? "—"
                    }
                    suffix={
                      wellbeingLatest.view.stats.completedProgramPct !== null
                        ? "%"
                        : undefined
                    }
                  />
                  <MiniStat
                    label="Employed"
                    value={wellbeingLatest.view.stats.employedPct ?? "—"}
                    suffix={
                      wellbeingLatest.view.stats.employedPct !== null
                        ? "%"
                        : undefined
                    }
                  />
                  <MiniStat
                    label="Reports"
                    value={wellbeing.reportCount}
                  />
                </div>
                {wellbeingLatest.view.changeData.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Change from baseline to 6 months
                    </p>
                    <ChangeChart data={wellbeingLatest.view.changeData} />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Latest report: {wellbeingLatest.report.title}
                  {wellbeingLatest.period
                    ? ` · ${wellbeingLatest.period.label}`
                    : ""}
                </p>
              </>
            ) : (
              <EmptyPanel
                message="No wellbeing reports generated yet."
                actionLabel="Import a workbook"
                actionHref="/import"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          Quick actions
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <QuickAction
            href="/import"
            icon={Upload}
            title="Import data"
            description="Upload a workbook to refresh donation or wellbeing records."
          />
          <QuickAction
            href="/donations/ledger"
            icon={Route}
            title="Donation ledger"
            description="Inspect traces, resolve matches, and confirm shelter delivery."
          />
          <QuickAction
            href="/ai"
            icon={Bot}
            title="Ask AI"
            description="Get answers grounded in your impact and wellbeing data."
          />
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prototype build. All sample data is de-identified and not representative
        of actual service or customer information.
      </p>
    </PageLayout>
  );
}

function OverviewStat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground group-hover:text-foreground/80">
          {hint}
        </p>
      ) : null}
    </Link>
  );
}

function MiniStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString("en-AU") : value;

  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-[0.7rem] text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums">
        {display}
        {suffix ?? ""}
      </p>
    </div>
  );
}

function EmptyPanel({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-lg border border-dashed p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button
        size="sm"
        render={<Link href={actionHref}>{actionLabel}</Link>}
      />
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Upload;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-sm font-medium">
          {title}
          <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { ArrowUpRight, FileText, TrendingUp } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { loadAllReports } from "@/lib/impact-reporting/report-service";
import { buildWellbeingDashboard } from "@/lib/impact-reporting/report-view";
import {
  PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL,
  PERSONAL_WELLBEING_INDEX_LABEL,
} from "@/lib/impact-reporting/metrics/definitions";
import { formatChange, formatScore } from "@/lib/impact-reporting/presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChangeChart,
  DomainMovementChart,
  PeriodTrendChart,
  WellbeingJourneyChart,
} from "@/components/impact/charts";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WellbeingPage() {
  const db = await getDb();
  const reports = await loadAllReports(db);
  const dashboard = buildWellbeingDashboard(reports);

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Wellbeing
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Track how {PERSONAL_WELLBEING_INDEX_LABEL} outcomes are trending over
          time. Upload {PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL} workbooks
          from the{" "}
          <Link
            href="/import"
            className="text-primary underline-offset-4 hover:underline"
          >
            Import
          </Link>{" "}
          page, then generate a report to add it to these trends.
        </p>
      </div>

      {dashboard.latest === null ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" /> No wellbeing data yet
            </CardTitle>
            <CardDescription>
              Generate your first report to start tracking wellbeing trends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/import">Import a workbook</Link>}
            />
          </CardContent>
        </Card>
      ) : (
        <WellbeingDashboard dashboard={dashboard} reports={reports} />
      )}
    </PageLayout>
  );
}

function WellbeingDashboard({
  dashboard,
  reports,
}: {
  dashboard: ReturnType<typeof buildWellbeingDashboard>;
  reports: Awaited<ReturnType<typeof loadAllReports>>;
}) {
  const latest = dashboard.latest!;
  const { stats } = latest.view;

  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground">
        Latest report:{" "}
        <span className="font-medium text-foreground">
          {latest.report.title}
        </span>
        {latest.period ? ` · ${latest.period.label}` : ""} · Data as at{" "}
        {formatDate(latest.report.dataFreshnessAt)}
      </p>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients"
          value={String(stats.clients)}
          hint="Latest reporting period"
        />
        <StatCard
          label={`${PERSONAL_WELLBEING_INDEX_LABEL} average (6 mo)`}
          value={formatScore(stats.pwiSixMo)}
          hint={`Baseline ${formatScore(stats.pwiBaseline)}`}
          accent={stats.pwiChange}
          accentLabel={`${formatChange(stats.pwiChange)} vs baseline`}
        />
        <StatCard
          label="Program completion"
          value={
            stats.completedProgramPct === null
              ? "—"
              : `${stats.completedProgramPct}%`
          }
          hint="Of tracked intakes"
        />
        <StatCard
          label="Employment"
          value={stats.employedPct === null ? "—" : `${stats.employedPct}%`}
          hint="Of tracked intakes"
        />
      </section>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Wellbeing journey over time</CardTitle>
          <CardDescription>
            Average score for each measurement group as clients move through the
            programme, shown as a percentage of each scale so the measures can be
            compared together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WellbeingJourneyChart data={dashboard.journey} />
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{PERSONAL_WELLBEING_INDEX_LABEL} — domain movement</CardTitle>
            <CardDescription>
              Average satisfaction (0–10) at baseline, 3 months and 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DomainMovementChart data={latest.view.movementPwi} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change from baseline to 6 months</CardTitle>
            <CardDescription>
              Positive movement is shown in green, regression in red.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangeChart data={latest.view.changeData} />
          </CardContent>
        </Card>
      </section>

      {dashboard.periodTrend.length > 1 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Trend across reporting periods</CardTitle>
            <CardDescription>
              {PERSONAL_WELLBEING_INDEX_LABEL} at intake (baseline) versus 6-month
              outcome for each reporting period, oldest to newest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PeriodTrendChart data={dashboard.periodTrend} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Wellbeing reports
          </CardTitle>
          <CardDescription>
            Open a report to view wellbeing outcomes, share, or export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {reports.map((loaded) => (
              <li
                key={loaded.report.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {loaded.report.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated {formatDate(loaded.report.generatedAt)}
                    {loaded.report.deidentified ? " · De-identified" : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/wellbeing/reports/${loaded.report.id}`}>
                      Open report
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
  accentLabel,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: number | null;
  accentLabel?: string;
}) {
  const accentClass =
    accent === undefined || accent === null || accent === 0
      ? "text-muted-foreground"
      : accent > 0
        ? "text-emerald-600 dark:text-emerald-500"
        : "text-destructive";
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-semibold tabular-nums">
          {value}
        </p>
        <div className="flex items-center gap-2 text-xs">
          {accentLabel ? (
            <span className={`flex items-center gap-1 ${accentClass}`}>
              {accent !== undefined && accent !== null && accent > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : null}
              {accentLabel}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

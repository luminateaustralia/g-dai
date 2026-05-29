import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getReport } from "@/lib/impact-reporting/report-service";
import { buildReportView } from "@/lib/impact-reporting/report-view";
import { buildReportExampleQuestions } from "@/lib/impact-reporting/ai-context";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { PERSONAL_WELLBEING_INDEX_LABEL } from "@/lib/impact-reporting/metrics/definitions";
import { formatChange, formatScore } from "@/lib/impact-reporting/presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MetricsTable } from "@/components/impact/metrics-table";
import { ReportActions } from "@/components/impact/report-actions";
import { WellbeingAssistant } from "@/components/impact/wellbeing-assistant";
import {
  ChangeChart,
  CohortComparisonChart,
  CompletionChart,
  DomainMovementChart,
} from "@/components/impact/charts";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ReportDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const loaded = await getReport(db, id);
  if (!loaded) notFound();

  const view = buildReportView(loaded);
  const { stats } = view;

  const user = await getCurrentUser();
  const canRunAi = roleHasPermission(user.role, "ai.run");
  const exampleQuestions = buildReportExampleQuestions(loaded);

  return (
    <PageLayout breadcrumbLabel={loaded.report.title}>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 print:hidden"
        render={
          <Link href="/wellbeing">
            <ArrowLeft /> Back to Wellbeing
          </Link>
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {loaded.report.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loaded.period ? `${loaded.period.label} · ` : ""}
            Data as at {formatDateTime(loaded.report.dataFreshnessAt)}
          </p>
          {loaded.report.deidentified ? (
            <Badge variant="outline" className="mt-1">
              <ShieldCheck className="size-3" /> De-identified report
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WellbeingAssistant
            endpoint={`/api/wellbeing/reports/${loaded.report.id}/assistant`}
            canRun={canRunAi}
            exampleQuestions={exampleQuestions}
          />
          <ReportActions reportId={loaded.report.id} />
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients"
          value={String(stats.clients)}
          hint="In this reporting period"
        />
        <StatCard
          label={`${PERSONAL_WELLBEING_INDEX_LABEL} average (6 mo)`}
          value={formatScore(stats.pwiSixMo)}
          hint={`Baseline ${formatScore(stats.pwiBaseline)}`}
          accent={stats.pwiChange}
          accentLabel={formatChange(stats.pwiChange)}
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

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Wellbeing Index — domain movement</CardTitle>
            <CardDescription>
              Average satisfaction (0–10) at baseline, 3 months and 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DomainMovementChart data={view.movementPwi} />
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
            <ChangeChart data={view.changeData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work readiness & confidence</CardTitle>
            <CardDescription>
              Wellbeing, confidence and work-readiness measures over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DomainMovementChart data={view.movementWork} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metric completion rates</CardTitle>
            <CardDescription>
              Share of clients with a recorded response at each time point.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletionChart data={view.completionData} />
          </CardContent>
        </Card>
      </section>

      {view.cohortData.length > 1 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cohort comparison</CardTitle>
            <CardDescription>
              Average Personal Wellbeing Index by cohort, baseline vs 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CohortComparisonChart data={view.cohortData} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All metrics — overall</CardTitle>
          <CardDescription>
            Frozen averages and change scores for this report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetricsTable rows={view.overallRows} />
        </CardContent>
      </Card>

      {view.cohortSections.map((section) => (
        <Card className="mt-6" key={section.cohort.id}>
          <CardHeader>
            <CardTitle>Cohort — {section.cohort.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsTable rows={section.rows} />
          </CardContent>
        </Card>
      ))}

      {loaded.report.methodologyNotes ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Methodology notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {loaded.report.methodologyNotes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Separator className="my-8" />
      <p className="text-xs text-muted-foreground">
        Generated {formatDateTime(loaded.report.generatedAt)}. Outputs are
        reproducible from the source import. Sample data is de-identified and not
        representative of actual service or customer information.
      </p>
    </PageLayout>
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
            <span className={accentClass}>{accentLabel}</span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

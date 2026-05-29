import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { buildImportPreview } from "@/lib/impact-reporting/report-service";
import { buildMetricsView } from "@/lib/impact-reporting/report-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ValidationIssues } from "@/components/validation-issues";
import { MetricsTable } from "@/components/impact/metrics-table";
import {
  ChangeChart,
  CohortComparisonChart,
  CompletionChart,
  DomainMovementChart,
} from "@/components/impact/charts";
import { GenerateForm } from "../../generate-form";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ importId: string }>;
}) {
  const { importId } = await params;
  const db = await getDb();
  const preview = await buildImportPreview(db, importId);
  if (!preview) notFound();

  const user = await getCurrentUser();
  const canGenerate = roleHasPermission(user.role, "impact.generate");
  const view = buildMetricsView(preview.aggregates, preview.cohorts);

  const errorCount = preview.validation.issues.filter(
    (i) => i.level === "error"
  ).length;
  const warningCount = preview.validation.issues.filter(
    (i) => i.level === "warning"
  ).length;

  return (
    <PageLayout breadcrumbLabel={preview.filename}>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/wellbeing">
            <ArrowLeft /> Back to Wellbeing
          </Link>
        }
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Review imported data
        </h1>
        <p className="text-muted-foreground">{preview.filename}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Clients"
          value={String(preview.clientCount)}
          icon={<Users className="size-4" />}
        />
        <SummaryStat
          label="Cohorts"
          value={String(preview.cohorts.length)}
        />
        <SummaryStat
          label="Observations"
          value={String(preview.validation.summary.totalObservations)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Data quality
              {errorCount > 0 ? (
                <Badge variant="destructive">{errorCount} errors</Badge>
              ) : null}
              {warningCount > 0 ? (
                <Badge variant="outline">{warningCount} warnings</Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              Issues are flagged before report generation. Reports cannot be
              generated while errors remain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidationIssues issues={preview.validation.issues} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate report</CardTitle>
            <CardDescription>
              Select the reporting period and generate a reproducible snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateForm
              importId={preview.importId}
              canGenerate={canGenerate && preview.validation.canGenerate}
              defaultTitle="Quarterly Wellbeing Report"
              defaultPeriod=""
            />
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
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
          <CardTitle>Preview — overall averages</CardTitle>
          <CardDescription>
            Live calculation from the imported data. The generated report will
            freeze these values.
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
            <CardDescription>
              Live averages for this cohort from the imported data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTable rows={section.rows} />
          </CardContent>
        </Card>
      ))}
    </PageLayout>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold">{value}</p>
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}

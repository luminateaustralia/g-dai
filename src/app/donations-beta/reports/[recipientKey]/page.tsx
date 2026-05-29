import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getBetaReportContext } from "@/app/donations-beta/actions";
import { PrintReportButton } from "@/components/donations-beta/print-report-button";
import { SendImpactReportButton } from "@/components/donations-beta/send-report-button";
import { formatWeekLabel } from "@/lib/donations-beta/normalisation/weeks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DonorReportPage({
  params,
}: {
  params: Promise<{ recipientKey: string }>;
}) {
  const { recipientKey } = await params;
  const { report, canSend } = await getBetaReportContext(recipientKey);
  if (!report) notFound();

  return (
    <PageLayout>
      <div className="print:hidden">
        <Link
          href="/donations-beta/reports"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to donor reports
        </Link>
      </div>

      <article className="mx-auto mt-6 max-w-3xl print:mt-0">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Impact report
            </h1>
            <p className="text-muted-foreground">{report.donorName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrintReportButton />
            <SendImpactReportButton
              recipientKey={report.recipientKey}
              disabled={!canSend || !report.email}
            />
          </div>
        </div>

        <Card className="mt-6 print:border-none print:shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-2xl">
              Your donation impact
            </CardTitle>
            <CardDescription>
              Thank you for supporting women&apos;s shelters through Too Good Co.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <section>
              <h2 className="text-lg font-semibold">Summary</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {report.totalMeals > 0 ? (
                  <li>
                    <strong>{report.totalMeals}</strong> meals donated and
                    allocated to shelters
                  </li>
                ) : null}
                {report.totalCarePacks > 0 ? (
                  <li>
                    <strong>{report.totalCarePacks}</strong> care packs donated
                    and allocated to shelters
                  </li>
                ) : null}
                {report.orderIds.length > 0 ? (
                  <li>Order references: {report.orderIds.join(", ")}</li>
                ) : null}
                {report.weeks.length > 0 ? (
                  <li>
                    Fulfilment weeks:{" "}
                    {report.weeks.map((week) => formatWeekLabel(week)).join(", ")}
                  </li>
                ) : null}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Where your support went</h2>
              <ul className="mt-3 space-y-3">
                {report.lines.map((line, index) => (
                  <li
                    key={`${line.weekId}-${line.donorOrderId}-${index}`}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">{line.shelterName}</p>
                    <p className="text-muted-foreground">
                      {line.qtyAllocated} {line.poolLabel.toLowerCase()} (
                      {line.productSubtypeLabel}) · {line.weekLabel}
                      {line.donorOrderId ? ` · Order ${line.donorOrderId}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-sm text-muted-foreground">
              Some shelter locations are described in general terms to protect
              confidentiality where required.
            </p>
          </CardContent>
        </Card>
      </article>
    </PageLayout>
  );
}

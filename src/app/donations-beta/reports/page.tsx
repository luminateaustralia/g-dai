import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import { buildAllocationLedger } from "@/lib/donations-beta/queries";
import { getLatestAllocationRun } from "@/lib/donations-beta/run-allocation";
import { buildDonorReports } from "@/lib/donations-beta/reports/build-donor-report";
import { SendImpactReportButton } from "@/components/donations-beta/send-report-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DonorReportsPage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const canSend = roleHasPermission(user.role, "donations.resolve");
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");

  const latestImport = await getLatestDonationImport(db);
  const run = latestImport
    ? await getLatestAllocationRun(db, latestImport.id)
    : null;

  const ledger = run
    ? await buildAllocationLedger(db, run.id, {}, canViewSensitive)
    : [];
  const reports = buildDonorReports(ledger, canViewSensitive);

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <Link
          href="/donations-beta"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to beta dashboard
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Donor impact reports
        </h1>
        <p className="text-muted-foreground">
          Repeat donors are aggregated by email. Each report covers all order
          IDs linked to that donor.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>
            {reports.length > 0
              ? `${reports.length} donor report${reports.length === 1 ? "" : "s"} ready.`
              : "Run allocation to generate donor reports."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Meals</TableHead>
                  <TableHead>Care packs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.recipientKey}>
                    <TableCell>{report.donorName}</TableCell>
                    <TableCell>{report.email ?? "—"}</TableCell>
                    <TableCell>{report.orderIds.join(", ") || "—"}</TableCell>
                    <TableCell>{report.totalMeals}</TableCell>
                    <TableCell>{report.totalCarePacks}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/donations-beta/reports/${encodeURIComponent(report.recipientKey)}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          View report
                        </Link>
                        <SendImpactReportButton
                          recipientKey={report.recipientKey}
                          disabled={!canSend || !report.email}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              No donor reports available yet.
            </p>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

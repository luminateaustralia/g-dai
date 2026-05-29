import Link from "next/link";
import { AlertTriangle, FileSpreadsheet, Upload } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { listDonationImports } from "@/lib/close-the-loop/queries";
import { ensureSeeded } from "@/lib/seed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteImportButton } from "@/components/import/delete-import-button";
import { UploadForm } from "@/components/upload-form";
import { PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL } from "@/lib/impact-reporting/metrics/definitions";
import { listImports } from "@/lib/impact-reporting/report-service";
import { uploadImpactWorkbookAction } from "@/app/wellbeing/actions";
import { uploadDonationWorkbookAction } from "@/app/donations/actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

type ImportRow = {
  id: string;
  type: "wellbeing" | "donation";
  filename: string;
  uploadedAt: Date;
  status: string;
  summary: string;
  href: string;
};

export default async function ImportPage() {
  const db = await getDb();
  await ensureSeeded(db);
  const user = await getCurrentUser();
  const canImportImpact = roleHasPermission(user.role, "impact.import");
  const canImportDonations = roleHasPermission(user.role, "donations.import");
  const canDeleteWellbeing = canImportImpact;
  const canDeleteDonations = canImportDonations;

  const [impactImports, donationImports] = await Promise.all([
    listImports(db),
    listDonationImports(db),
  ]);

  const imports: ImportRow[] = [
    ...impactImports.map((imp) => ({
      id: imp.id,
      type: "wellbeing" as const,
      filename: imp.filename,
      uploadedAt: imp.uploadedAt,
      status: imp.status,
      summary: `${imp.observationCount} observations · ${imp.intakeCount} intakes`,
      href: `/wellbeing/review/${imp.id}`,
    })),
    ...donationImports.map((imp) => ({
      id: imp.id,
      type: "donation" as const,
      filename: imp.filename,
      uploadedAt: imp.uploadedAt,
      status: imp.status,
      summary: `${imp.orderCount} orders · ${imp.shelterCount} shelters · ${imp.fulfilmentCount} donations`,
      href: "/donations",
    })),
  ].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Data import
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Upload source workbooks for donation impact tracking or Personal
          Wellbeing Index reporting. After import, review and explore the data on
          the{" "}
          <Link href="/donations" className="text-primary underline-offset-4 hover:underline">
            Impact
          </Link>{" "}
          and{" "}
          <Link href="/wellbeing" className="text-primary underline-offset-4 hover:underline">
            Wellbeing
          </Link>{" "}
          pages.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Import {PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL}
            </CardTitle>
            <CardDescription>
              Upload an .xlsx workbook with a Data Entry sheet for Personal
              Wellbeing Index reporting. Scoring rules are applied from the
              configured metric definitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm
              action={uploadImpactWorkbookAction}
              disabled={!canImportImpact}
              disabledReason="Your current role cannot import impact data. Switch to Impact analyst or Administrator."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-4" /> Import donation workbook
            </CardTitle>
            <CardDescription>
              Upload the de-identified workbook (Customer orders, Shelters, Meals
              and Care pack sheets) for donation impact tracking. Matching runs
              automatically after import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm
              action={uploadDonationWorkbookAction}
              disabled={!canImportDonations}
              disabledReason="Your current role cannot import donation data. Switch to Operations or Administrator."
              buttonLabel="Import & match"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4" /> Import history
          </CardTitle>
          <CardDescription>
            All uploaded workbooks, newest first. Each import is a frozen snapshot
            with a checksum for reproducibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No imports yet. Upload a workbook above to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp) => (
                  <TableRow key={`${imp.type}-${imp.id}`}>
                    <TableCell>
                      {imp.type === "wellbeing" ? "Wellbeing" : "Donation impact"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate font-medium">
                      {imp.filename}
                    </TableCell>
                    <TableCell>{formatDate(imp.uploadedAt)}</TableCell>
                    <TableCell>
                      {imp.status === "imported_with_errors" ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="size-3" /> Errors
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Imported</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {imp.summary}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={imp.href}>
                              {imp.type === "wellbeing"
                                ? "Review"
                                : "View impact"}
                            </Link>
                          }
                        />
                        <DeleteImportButton
                          type={imp.type}
                          importId={imp.id}
                          filename={imp.filename}
                          disabled={
                            imp.type === "wellbeing"
                              ? !canDeleteWellbeing
                              : !canDeleteDonations
                          }
                          disabledReason={
                            imp.type === "wellbeing"
                              ? "Your current role cannot delete wellbeing imports. Switch to Impact analyst or Administrator."
                              : "Your current role cannot delete donation imports. Switch to Operations or Administrator."
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

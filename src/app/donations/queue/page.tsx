import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  getLatestDonationImport,
  listReviewQueue,
} from "@/lib/close-the-loop/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TraceStatusBadge } from "@/components/donations/trace-status-badge";
import { TraceResolveControls } from "@/components/donations/trace-resolve";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");
  const canResolve = roleHasPermission(user.role, "donations.resolve");

  const latest = await getLatestDonationImport(db);
  const rows = latest
    ? await listReviewQueue(db, latest.id, canViewSensitive)
    : [];

  return (
    <PageLayout>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations">
            <ArrowLeft /> Back to Impact
          </Link>
        }
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Review queue
        </h1>
        <p className="text-muted-foreground">
          Donations that are unmatched, uncertain, or need a human decision.
          Confirming or rejecting a link marks it as a manual override that the
          matching engine will preserve.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{rows.length} records need attention</CardTitle>
          <CardDescription>
            Resolve links to improve donor-to-shelter traceability coverage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing to review. Every donation has a confident match.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Resolve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.fulfilmentId}>
                    <TableCell>
                      <TraceStatusBadge
                        status={row.status}
                        confidence={row.confidence}
                        matchMethod={row.matchMethod}
                        manualOverride={row.manualOverride}
                        reasons={row.reasons}
                      />
                    </TableCell>
                    <TableCell>
                      {row.donorName ?? (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.product ?? "—"}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {row.productCategory}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.shelter?.displayName ?? (
                        <span className="text-muted-foreground">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.traceId ? (
                        <TraceResolveControls
                          traceId={row.traceId}
                          canResolve={canResolve}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No trace record
                        </span>
                      )}
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

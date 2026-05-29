import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getDonorProfile } from "@/lib/close-the-loop/queries";
import { parseTraceReasons } from "@/lib/close-the-loop/matching/explain";
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

export const dynamic = "force-dynamic";

export default async function DonorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const profile = await getDonorProfile(db, id);
  if (!profile) notFound();

  const tracedCount = profile.traces.filter(
    (t) => t.status === "matched" || t.status === "partial"
  ).length;

  return (
    <PageLayout breadcrumbLabel={profile.name ?? "Donor"}>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations/ledger">
            <ArrowLeft /> Back to ledger
          </Link>
        }
      />

      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {profile.name ?? "Donor"}
        </h1>
        {profile.donor.email ? (
          <p className="text-muted-foreground">{profile.donor.email}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(profile.orders.length)} />
        <Stat label="Trace records" value={String(profile.traces.length)} />
        <Stat label="Linked to a shelter" value={String(tracedCount)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Orders placed by this donor and their donation category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.orderId ?? "—"}
                    </TableCell>
                    <TableCell>{o.product ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.productCategory ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.totalQuantity ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[o.suburb, o.state, o.postcode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Traceability</CardTitle>
          <CardDescription>
            Where this donor&apos;s contributions have been traced.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.traces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No traces yet for this donor.
            </p>
          ) : (
            <ul className="divide-y">
              {profile.traces.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <TraceStatusBadge
                    status={t.status}
                    confidence={t.confidence}
                    matchMethod={t.matchMethod}
                    manualOverride={t.manualOverride}
                    reasons={parseTraceReasons(t.sourceRecords)}
                  />
                  <Link
                    href={`/donations/traces/${t.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View trace
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

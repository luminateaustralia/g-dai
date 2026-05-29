import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  buildLedger,
  filterNeedsAttention,
  getLatestDonationImport,
} from "@/lib/close-the-loop/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type LedgerSearchParams = {
  search?: string;
  category?: string;
  status?: string;
  source?: string;
  view?: string;
};

function ledgerHref(params: LedgerSearchParams) {
  const sp = new URLSearchParams();
  if (params.view === "needs_attention") sp.set("view", "needs_attention");
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.status) sp.set("status", params.status);
  if (params.source) sp.set("source", params.source);
  const query = sp.toString();
  return query ? `/donations/ledger?${query}` : "/donations/ledger";
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const isNeedsAttentionView = sp.view === "needs_attention";
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");
  const canResolve = roleHasPermission(user.role, "donations.resolve");

  const filterParams = {
    search: sp.search,
    category: sp.category,
    status: sp.status,
    source: sp.source,
  };

  const latest = await getLatestDonationImport(db);
  const allRows = latest
    ? await buildLedger(db, latest.id, filterParams, canViewSensitive)
    : [];
  const needsAttentionCount = filterNeedsAttention(allRows).length;
  const rows = isNeedsAttentionView ? filterNeedsAttention(allRows) : allRows;

  const preservedParams = {
    search: sp.search,
    category: sp.category,
    status: sp.status,
    source: sp.source,
  };

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
          Donation ledger
        </h1>
        <p className="text-muted-foreground">
          {isNeedsAttentionView
            ? "Donations that are unmatched, uncertain, or need a human decision. Confirming or rejecting a link marks it as a manual override that the matching engine will preserve."
            : "Every donated item, linked to its donor and recipient shelter where a reliable match exists."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={ledgerHref(preservedParams)}
          className={cn(
            "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
            !isNeedsAttentionView
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-muted"
          )}
        >
          All donations
        </Link>
        <Link
          href={ledgerHref({ ...preservedParams, view: "needs_attention" })}
          className={cn(
            "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
            isNeedsAttentionView
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-muted"
          )}
        >
          Needs attention ({needsAttentionCount})
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter by donor, product, shelter, donation type and match status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            {isNeedsAttentionView ? (
              <input type="hidden" name="view" value="needs_attention" />
            ) : null}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="search">
                Search
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={sp.search ?? ""}
                placeholder="Donor, product, shelter, postcode"
                className="w-64"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={sp.category ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">All</option>
                <option value="meal">Meal</option>
                <option value="care_pack">Care pack</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="source">
                Donation type
              </label>
              <select
                id="source"
                name="source"
                defaultValue={sp.source ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">All</option>
                <option value="meal">Meals</option>
                <option value="carepak">Care packs</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={sp.status ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">All</option>
                <option value="matched">Confirmed</option>
                <option value="partial">Likely</option>
                <option value="needs_review">Needs review</option>
                <option value="unmatched">Unmatched</option>
                <option value="untraced">Untraced</option>
              </select>
            </div>
            <Button type="submit" size="sm">
              <Search /> Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {isNeedsAttentionView
              ? `${rows.length} record${rows.length === 1 ? "" : "s"} need attention`
              : `${rows.length} donation${rows.length === 1 ? "" : "s"}`}
          </CardTitle>
          {isNeedsAttentionView ? (
            <CardDescription>
              Resolve links to improve donor-to-shelter traceability coverage.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isNeedsAttentionView
                ? "Nothing to review. Every donation has a confident match."
                : "No donations match these filters."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Date</TableHead>
                  {isNeedsAttentionView ? (
                    <TableHead>Resolve</TableHead>
                  ) : (
                    <TableHead></TableHead>
                  )}
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
                      {row.donorId ? (
                        <Link
                          href={`/donations/donors/${row.donorId}`}
                          className="text-primary hover:underline"
                        >
                          {row.donorName ?? "Donor"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {row.donorName ?? "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {row.product ?? "—"}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {row.productCategory}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.shelter ? (
                        <Link
                          href={`/donations/shelters/${row.shelter.id}`}
                          className="hover:underline"
                        >
                          {row.shelter.displayName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.fulfilmentDate ?? row.dispatchDate ?? "—"}
                    </TableCell>
                    <TableCell className={isNeedsAttentionView ? undefined : "text-right"}>
                      {isNeedsAttentionView ? (
                        row.traceId ? (
                          <TraceResolveControls
                            traceId={row.traceId}
                            canResolve={canResolve}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No trace record
                          </span>
                        )
                      ) : row.traceId ? (
                        <Link
                          href={`/donations/traces/${row.traceId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Trace
                        </Link>
                      ) : null}
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

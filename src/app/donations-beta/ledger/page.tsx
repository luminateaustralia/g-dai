import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import { buildAllocationLedger, listAllocationWeeks } from "@/lib/donations-beta/queries";
import { getLatestAllocationRun } from "@/lib/donations-beta/run-allocation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function AllocationLedgerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");

  const latestImport = await getLatestDonationImport(db);
  const run = latestImport
    ? await getLatestAllocationRun(db, latestImport.id)
    : null;

  const rows = run
    ? await buildAllocationLedger(
        db,
        run.id,
        {
          search: sp.search,
          pool: sp.pool === "meal" || sp.pool === "care_pack" ? sp.pool : undefined,
          weekId: sp.weekId,
          subtype: sp.subtype,
          gapOnly: sp.gapOnly === "1",
        },
        canViewSensitive
      )
    : [];

  const weeks = run ? await listAllocationWeeks(db, run.id) : [];
  const subtypes = [...new Set(rows.map((row) => row.productSubtype))].sort();

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
          Allocation ledger
        </h1>
        <p className="text-muted-foreground">
          Weekly donor-to-shelter allocations, carry-forward balances, and Too
          Good gap fills.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {run
              ? `${rows.length} row${rows.length === 1 ? "" : "s"} in the latest allocation run.`
              : "Run allocation to populate the ledger."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="search">
                Search
              </label>
              <div className="relative">
                <Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="search"
                  defaultValue={sp.search}
                  placeholder="Donor, shelter, order…"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="pool">
                Pool
              </label>
              <select id="pool" name="pool" defaultValue={sp.pool ?? ""} className={SELECT_CLASS}>
                <option value="">All pools</option>
                <option value="meal">Meals</option>
                <option value="care_pack">Care packs</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="weekId">
                Week
              </label>
              <select id="weekId" name="weekId" defaultValue={sp.weekId ?? ""} className={SELECT_CLASS}>
                <option value="">All weeks</option>
                {[...new Set(weeks.map((week) => week.weekId))].map((weekId) => (
                  <option key={weekId} value={weekId}>
                    {weekId}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="subtype">
                Subtype
              </label>
              <select
                id="subtype"
                name="subtype"
                defaultValue={sp.subtype ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">All subtypes</option>
                {subtypes.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="gapOnly"
                value="1"
                defaultChecked={sp.gapOnly === "1"}
              />
              Gap fills only
            </label>
            <Button type="submit" size="sm">
              Apply
            </Button>
            {run ? (
              <Link
                href="/donations-beta/export"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Export CSV
              </Link>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0">
          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Subtype</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Carry-forward</TableHead>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.weekLabel}</TableCell>
                    <TableCell>{row.poolLabel}</TableCell>
                    <TableCell>{row.productSubtypeLabel}</TableCell>
                    <TableCell>
                      {row.tooGoodGapFill ? (
                        <span className="text-muted-foreground">Too Good</span>
                      ) : (
                        <div>
                          <p>{row.donorName}</p>
                          {row.donorOrderId ? (
                            <p className="text-xs text-muted-foreground">
                              Order {row.donorOrderId}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{row.qtyAllocatedThisWeek}</TableCell>
                    <TableCell>{row.carryForwardBalance ?? "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p>{row.shelterName}</p>
                        {row.shelterSuburb ? (
                          <p className="text-xs text-muted-foreground">
                            {row.shelterSuburb}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.tooGoodGapFill ? (
                        <Badge variant="destructive">{row.gapQty}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              No allocation rows yet.{" "}
              <Link href="/donations-beta" className="text-primary underline-offset-4 hover:underline">
                Run allocation
              </Link>{" "}
              from the beta dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

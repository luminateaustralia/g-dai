import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  getLatestDonationImport,
  listShelters,
} from "@/lib/close-the-loop/queries";
import {
  Card,
  CardContent,
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

export const dynamic = "force-dynamic";

export default async function SheltersPage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");

  const latest = await getLatestDonationImport(db);
  const shelters = latest
    ? await listShelters(db, latest.id, canViewSensitive)
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
          Shelter directory
        </h1>
        <p className="text-muted-foreground">
          {canViewSensitive
            ? "You can view full details, including shelters with sensitive addresses."
            : "Shelters with sensitive addresses are shown with their location withheld."}
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{shelters.length} shelters</CardTitle>
        </CardHeader>
        <CardContent>
          {shelters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shelters imported yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Eligibility</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelters.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/donations/shelters/${s.id}`}
                        className="hover:underline"
                      >
                        {s.displayName}
                      </Link>
                      {s.sensitiveAddress ? (
                        <Badge variant="outline" className="ml-2">
                          <ShieldAlert className="size-3" /> Sensitive
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.masked
                        ? `${s.region ?? "Location withheld"}`
                        : [s.suburb, s.lga, s.postcode]
                            .filter(Boolean)
                            .join(", ") || s.state || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {s.mealsEligible ? (
                          <Badge variant="secondary">Meals</Badge>
                        ) : null}
                        {s.carepackEligible ? (
                          <Badge variant="secondary">Care packs</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.donationCount}
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

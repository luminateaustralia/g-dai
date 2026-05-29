import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getShelterProfile } from "@/lib/close-the-loop/queries";
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

export const dynamic = "force-dynamic";

export default async function ShelterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");

  const profile = await getShelterProfile(db, id, canViewSensitive);
  if (!profile) notFound();
  const { shelter } = profile;

  return (
    <PageLayout
      className="max-w-5xl"
      breadcrumbLabel={shelter.displayName}
    >
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations/shelters">
            <ArrowLeft /> Back to shelters
          </Link>
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {shelter.displayName}
          </h1>
          <p className="text-muted-foreground">
            {shelter.masked
              ? `Location withheld${shelter.region ? ` · ${shelter.region}` : ""}`
              : [shelter.suburb, shelter.lga, shelter.state, shelter.postcode]
                  .filter(Boolean)
                  .join(", ")}
          </p>
        </div>
        {shelter.sensitiveAddress ? (
          <Badge variant="outline">
            <ShieldAlert className="size-3" /> Sensitive address
          </Badge>
        ) : null}
      </div>

      {shelter.masked ? (
        <Card className="mt-6">
          <CardContent className="py-4 text-sm text-muted-foreground">
            This shelter has a sensitive address. Precise location details are
            withheld for your role. Switch to Operations or Administrator to view
            full details.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total donations" value={String(profile.totalDonations)} />
        <Stat label="Items donated" value={String(profile.totalQuantity)} />
        <Stat
          label="Eligibility"
          value={[
            shelter.mealsEligible ? "Meals" : null,
            shelter.carepackEligible ? "Care packs" : null,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Donations received</CardTitle>
          <CardDescription>
            Donated items recorded as delivered to this shelter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.fulfilments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No donations recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.fulfilments.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.product ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.productCategory}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f.quantity ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.fulfilmentDate ?? f.dispatchDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.status ?? "—"}
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

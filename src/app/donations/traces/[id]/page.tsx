import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Package, Home, User } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { getTraceDetail } from "@/lib/close-the-loop/queries";
import { parseTraceReasons } from "@/lib/close-the-loop/matching/explain";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TraceStatusBadge } from "@/components/donations/trace-status-badge";
import { TraceResolveControls } from "@/components/donations/trace-resolve";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  exact_order_id: "Exact Order ID match (legacy)",
  category_qty_date_postcode: "Inferred (category, postcode, quantity)",
  shelter_product_date: "Inferred (shelter, product, date)",
  manual: "Manual decision",
  none: "No match",
};

export default async function TraceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const user = await getCurrentUser();
  const canViewSensitive = roleHasPermission(user.role, "donations.view_sensitive");
  const canResolve = roleHasPermission(user.role, "donations.resolve");

  const detail = await getTraceDetail(db, id, canViewSensitive);
  if (!detail) notFound();
  const { trace, fulfilment, order, shelter } = detail;

  return (
    <PageLayout className="max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations/queue">
            <ArrowLeft /> Back to review queue
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Donation trace
        </h1>
        <div className="flex items-center gap-2">
          <TraceStatusBadge
            status={trace.status}
            confidence={trace.confidence}
            matchMethod={trace.matchMethod}
            manualOverride={trace.manualOverride}
            reasons={parseTraceReasons(trace.sourceRecords)}
          />
          {trace.manualOverride ? (
            <Badge variant="outline">Manual override</Badge>
          ) : null}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Trace path</CardTitle>
          <CardDescription>
            Donor → donated product → dispatch → shelter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <PathNode
              icon={<User className="size-4" />}
              title={detail.donorName ?? "Unmatched donor"}
              subtitle={order?.orderId ? `Order ${order.orderId}` : "No order linked"}
              href={order?.donorId ? `/donations/donors/${order.donorId}` : undefined}
            />
            <Arrow />
            <PathNode
              icon={<Package className="size-4" />}
              title={fulfilment?.product ?? "Donated item"}
              subtitle={`${fulfilment?.productCategory ?? "—"} · qty ${fulfilment?.quantity ?? "—"}`}
            />
            <Arrow />
            <PathNode
              icon={<Home className="size-4" />}
              title={shelter?.displayName ?? "Unlinked shelter"}
              subtitle={
                shelter?.masked
                  ? shelter.region ?? "Location withheld"
                  : [shelter?.suburb, shelter?.state].filter(Boolean).join(", ") ||
                    "—"
              }
              href={shelter ? `/donations/shelters/${shelter.id}` : undefined}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Match details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Method" value={METHOD_LABELS[trace.matchMethod] ?? trace.matchMethod} />
            <Row
              label="Confidence"
              value={`${Math.round(trace.confidence * 100)}%`}
            />
            <Row
              label="Dispatch date"
              value={fulfilment?.dispatchDate ?? "—"}
            />
            <Row label="Status" value={fulfilment?.status ?? "—"} />
            {trace.notes ? <Row label="Reviewer note" value={trace.notes} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolve</CardTitle>
            <CardDescription>
              Override the automated decision where needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TraceResolveControls traceId={trace.id} canResolve={canResolve} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Why this match?</CardTitle>
          <CardDescription>
            The candidate orders considered, for explainability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No candidate orders were found.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {detail.attempts
                .sort((a, b) => b.confidence - a.confidence)
                .map((attempt) => {
                  let reasons: string[] = [];
                  try {
                    reasons = JSON.parse(attempt.detail ?? "[]");
                  } catch {
                    reasons = [];
                  }
                  return (
                    <li
                      key={attempt.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="text-sm">
                        <p className="font-medium">
                          {Math.round(attempt.confidence * 100)}% ·{" "}
                          {METHOD_LABELS[attempt.method] ?? attempt.method}
                        </p>
                        <p className="text-muted-foreground">
                          {reasons.join("; ") || "No matching attributes"}
                        </p>
                      </div>
                      {attempt.accepted ? (
                        <Badge variant="secondary">Accepted</Badge>
                      ) : null}
                    </li>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

function PathNode({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <div className="flex-1 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
      </div>
      <p className="mt-1 font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="flex-1 transition-colors hover:bg-muted/40">
      {content}
    </Link>
  ) : (
    content
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-muted-foreground">
      <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

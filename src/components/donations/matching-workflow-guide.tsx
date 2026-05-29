"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  GitCompareArrows,
  Hand,
  Package,
  User,
} from "lucide-react";

import { TraceStatusBadge } from "@/components/donations/trace-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SCORING_RULES = [
  { signal: "Product category", weight: "+50%", note: "Same category on order and fulfilment" },
  { signal: "Postcode", weight: "+30%", note: "Donor order postcode matches dispatch postcode" },
  { signal: "Quantity", weight: "+20%", note: "Order total quantity matches fulfilment quantity" },
] as const;

const STATUS_RULES = [
  {
    status: "matched" as const,
    rule: "≥ 95% confidence with a single clear best candidate",
    meaning: "Shown as Confirmed in the impact summary",
  },
  {
    status: "partial" as const,
    rule: "≥ 60% confidence with a single clear best candidate",
    meaning: "Shown as Likely — strong inferred link",
  },
  {
    status: "needs_review" as const,
    rule: "≥ 30% but uncertain, or tied top candidates",
    meaning: "Appears in the review queue for a human decision",
  },
  {
    status: "unmatched" as const,
    rule: "Below 30% confidence",
    meaning: "No reliable donor order found for this donation",
  },
] as const;

export function MatchingWorkflowGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitCompareArrows className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>How matching works</CardTitle>
              <CardDescription>
                How donor orders are linked to shelter donations after import.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Hide" : "Show"}
            <ChevronDown
              className={cn("transition-transform", open && "rotate-180")}
            />
          </Button>
        </div>
      </CardHeader>

      {open ? (
        <CardContent className="flex flex-col gap-6 pt-2">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">End-to-end flow</h3>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
              <FlowStep
                icon={<User className="size-4" />}
                title="Customer orders"
                description="Donor purchases imported from the workbook."
              />
              <FlowArrow />
              <FlowStep
                icon={<GitCompareArrows className="size-4" />}
                title="Matching engine"
                description="Each shelter donation is scored against every order."
              />
              <FlowArrow />
              <FlowStep
                icon={<Package className="size-4" />}
                title="Donation traces"
                description="Links appear in the ledger with a confidence and status."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Matching runs automatically after import. Use{" "}
              <span className="font-medium text-foreground">Re-run matching</span>{" "}
              to rebuild traces when data changes. Manual decisions in the review
              queue are preserved and never overwritten.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Scoring signals</h3>
              <p className="text-sm text-muted-foreground">
                Order ID columns in customer orders and shelter dispatch sheets
                are separate identifier systems and are not compared. Confidence
                is built from overlapping attributes only, capped at 95%.
                Customer-order dates are not available in the import, so they do
                not contribute.
              </p>
              <ul className="flex flex-col gap-2">
                {SCORING_RULES.map((rule) => (
                  <li
                    key={rule.signal}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-medium">{rule.signal}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {rule.weight}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{rule.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Trace statuses</h3>
              <p className="text-sm text-muted-foreground">
                The highest-scoring order becomes the proposed link. The top three
                candidates are stored on each trace for explainability.
              </p>
              <ul className="flex flex-col gap-2">
                {STATUS_RULES.map((item) => (
                  <li
                    key={item.status}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <TraceStatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 font-medium">{item.rule}</p>
                    <p className="mt-1 text-muted-foreground">{item.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-lg border border-dashed bg-muted/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <Hand className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Human review</p>
                <p className="mt-1 text-muted-foreground">
                  Open the review queue to confirm, reject, or override uncertain
                  links. Overrides are flagged on the trace and kept on future
                  matching runs.
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      ) : null}
    </Card>
  );
}

function FlowStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center text-muted-foreground lg:px-1">
      <ArrowRight className="size-4 rotate-90 lg:rotate-0" />
    </div>
  );
}

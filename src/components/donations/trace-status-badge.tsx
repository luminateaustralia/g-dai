"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  explainTraceStatus,
  SCORING_WEIGHTS,
  type TraceStatusLike,
} from "@/lib/close-the-loop/matching/explain";

const STATUS_META: Record<
  TraceStatusLike,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  matched: {
    label: "Confirmed match",
    variant: "default",
    className:
      "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  partial: { label: "Likely match", variant: "secondary" },
  needs_review: {
    label: "Needs review",
    variant: "outline",
    className: "text-amber-700 dark:text-amber-400",
  },
  unmatched: { label: "Unmatched", variant: "destructive" },
  untraced: { label: "Untraced", variant: "outline" },
};

export type TraceStatusBadgeProps = {
  status: string;
  confidence?: number;
  matchMethod?: string | null;
  manualOverride?: boolean;
  reasons?: string[];
};

export function TraceStatusBadge({
  status,
  confidence,
  matchMethod,
  manualOverride,
  reasons,
}: TraceStatusBadgeProps) {
  const key = (status as TraceStatusLike) in STATUS_META
    ? (status as TraceStatusLike)
    : "untraced";
  const meta = STATUS_META[key];
  const explanation = explainTraceStatus({
    status: key,
    confidence,
    matchMethod,
    manualOverride,
    reasons,
  });
  const showWeights = matchMethod === "category_qty_date_postcode";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant={meta.variant}
            className={cn(
              "cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-2",
              meta.className
            )}
            tabIndex={0}
            aria-label={`${meta.label} — ${explanation.summary}`}
          >
            {meta.label}
          </Badge>
        }
      />
      <TooltipContent>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold">{explanation.label}</span>
            {explanation.confidencePct !== null ? (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {explanation.confidencePct}% confidence
              </span>
            ) : null}
          </div>

          <p className="text-muted-foreground">{explanation.summary}</p>

          {explanation.signals.length > 0 ? (
            <div>
              <p className="font-medium">Signals used</p>
              <ul className="mt-0.5 list-inside list-disc text-muted-foreground">
                {explanation.signals.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {showWeights ? (
            <p className="text-[11px] text-muted-foreground">
              Scored on{" "}
              {SCORING_WEIGHTS.map((w) => `${w.label} ${w.weight}`).join(" · ")}
            </p>
          ) : null}

          <p className="border-t border-foreground/10 pt-1.5 text-[11px] text-muted-foreground">
            Rule: {explanation.rule}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

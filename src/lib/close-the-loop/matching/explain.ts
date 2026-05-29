import type { TraceStatus } from "@/db/schema";

export type TraceStatusLike = TraceStatus | "untraced";

/**
 * A human-readable, fully traceable account of why a donation trace landed on a
 * given status. Every field is derived from the same signals the matching
 * engine recorded (see `score.ts` / `engine.ts`), so reviewers can audit the
 * decision without opening the trace detail page.
 */
export type StatusExplanation = {
  label: string;
  summary: string;
  signals: string[];
  confidencePct: number | null;
  rule: string;
};

const STATUS_LABELS: Record<TraceStatusLike, string> = {
  matched: "Confirmed match",
  partial: "Likely match",
  needs_review: "Needs review",
  unmatched: "Unmatched",
  untraced: "Untraced",
};

export type ExplainInput = {
  status: TraceStatusLike;
  confidence?: number;
  matchMethod?: string | null;
  manualOverride?: boolean;
  reasons?: string[];
};

/**
 * Pulls the matching reasons recorded against a trace out of its
 * `sourceRecords` JSON blob. Returns an empty list if absent or malformed.
 */
export function parseTraceReasons(
  sourceRecords: string | null | undefined
): string[] {
  if (!sourceRecords) return [];
  try {
    const parsed = JSON.parse(sourceRecords) as { reasons?: unknown };
    if (Array.isArray(parsed?.reasons)) {
      return parsed.reasons.filter((r): r is string => typeof r === "string");
    }
  } catch {
    return [];
  }
  return [];
}

export function explainTraceStatus(input: ExplainInput): StatusExplanation {
  const { status } = input;
  const confidence = input.confidence ?? 0;
  const reasons = input.reasons ?? [];
  const label = STATUS_LABELS[status] ?? STATUS_LABELS.untraced;
  const confidencePct =
    status === "untraced" || typeof input.confidence !== "number"
      ? null
      : Math.round(confidence * 100);

  if (status === "untraced") {
    return {
      label,
      summary:
        "Matching hasn't run for this dispatch yet, so it isn't linked to a donor.",
      signals: [],
      confidencePct: null,
      rule: "No trace record exists — run matching to evaluate candidate orders.",
    };
  }

  if (input.manualOverride || input.matchMethod === "manual") {
    return {
      label,
      summary:
        "A reviewer set this status by hand, which overrides the automated matching result.",
      signals: reasons,
      confidencePct,
      rule: "Manual decision — preserved and never recomputed by the matching engine.",
    };
  }

  if (input.matchMethod === "exact_order_id") {
    return {
      label,
      summary:
        "This trace used a retired rule that compared Order ID strings across import sheets. Those IDs are separate systems — re-run matching to apply current logic.",
      signals: reasons,
      confidencePct,
      rule: "Legacy exact Order ID match (no longer used).",
    };
  }

  if (status === "matched") {
    return {
      label,
      summary:
        "The available signals agreed strongly enough to confirm the link automatically.",
      signals: reasons,
      confidencePct,
      rule: "Inferred confidence ≥ 95% → Confirmed.",
    };
  }

  if (status === "partial") {
    return {
      label,
      summary:
        "One customer order is the clear front-runner, but the signals aren't strong enough to confirm automatically.",
      signals: reasons,
      confidencePct,
      rule: "Inferred confidence 60–94% with a single front-runner → Likely match.",
    };
  }

  if (status === "needs_review") {
    if (confidence >= 0.6) {
      return {
        label,
        summary:
          "Two or more customer orders scored equally well, so a person needs to choose the correct one.",
        signals: reasons,
        confidencePct,
        rule: "Tied top candidates at the same confidence → Needs review.",
      };
    }
    return {
      label,
      summary:
        "Only weak signals lined up — enough to suggest a donor, but not enough to confirm automatically.",
      signals: reasons,
      confidencePct,
      rule: "Inferred confidence 30–59% → Needs review.",
    };
  }

  // unmatched
  return {
    label,
    summary:
      "No customer order reached the minimum confidence, so this dispatch couldn't be linked to a donor.",
    signals: reasons,
    confidencePct,
    rule: "Best inferred confidence below 30% → Unmatched.",
  };
}

/**
 * The fixed weighting used by the inferred-match scorer, surfaced for the UI so
 * the "how" behind a confidence score is visible and auditable.
 */
export const SCORING_WEIGHTS: { label: string; weight: string }[] = [
  { label: "Product category", weight: "50%" },
  { label: "Postcode", weight: "30%" },
  { label: "Quantity", weight: "20%" },
];

import type { DonationCategory } from "@/db/schema";

/**
 * Classifies a raw product / category string into a donation category.
 * Order matters: meals are checked before the generic "other".
 */
export function normaliseProductCategory(
  ...candidates: (string | null | undefined)[]
): DonationCategory {
  const text = candidates
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!text) return "other";
  if (/\bmeals?\b|donated meal/.test(text)) return "meal";
  if (/care\s?pa(ck|k)|love\s*\+?\s*care|carepak/.test(text)) return "care_pack";
  return "other";
}

/**
 * Produces a human-readable "what was delivered" label from a raw product
 * string. Meals are bucketed by temperature (Fresh / Frozen) and whether they
 * are kids-friendly; everything else falls back to a tidied product name or the
 * donation source.
 */
export function donationProductLabel(
  product: string | null | undefined,
  source: string | null | undefined
): string {
  const text = (product ?? "").toLowerCase();
  const category = normaliseProductCategory(product, source);

  if (category === "meal") {
    const temperature = /frozen/.test(text)
      ? "Frozen"
      : /fresh/.test(text)
        ? "Fresh"
        : null;
    const base = temperature ? `${temperature} meals` : "Meals";
    return /kids/.test(text) ? `${base} (kids friendly)` : base;
  }

  if (category === "care_pack") return "Care packs";

  const cleaned = (product ?? "")
    .replace(/donated/gi, "")
    .replace(/[-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Other";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/** Normalises a shelter / company name for tolerant matching. */
export function normaliseShelterName(value: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|inc|incorporated|ltd|pty|foundation|community|house)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalisePostcode(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits.length) return null;
  return digits.padStart(4, "0").slice(0, 4);
}

/**
 * Parses common spreadsheet date representations (Date objects or
 * dd/mm/yyyy strings) into an ISO date (YYYY-MM-DD) using UTC parts.
 */
export function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  const dmy = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/** Whole-day difference between two ISO dates, or null if either is missing. */
export function dayDifference(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.abs(Math.round((da - db) / 86_400_000));
}

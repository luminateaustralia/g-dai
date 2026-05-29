import type { AllocationPool } from "@/db/schema";

export const MEAL_SUBTYPES = [
  "fresh",
  "frozen",
  "kids_friendly",
  "vegetarian",
  "other",
] as const;
export type MealSubtype = (typeof MEAL_SUBTYPES)[number];

export const CARE_PACK_SUBTYPES = [
  "love_care_pack",
  "care_packing",
  "donated_meals_bundle",
  "standard",
  "other",
] as const;
export type CarePackSubtype = (typeof CARE_PACK_SUBTYPES)[number];

export function normaliseMealSubtype(
  product: string | null | undefined
): MealSubtype {
  const text = (product ?? "").toLowerCase();
  if (/kids/.test(text)) return "kids_friendly";
  if (/vegetarian|vegan|\bveg\b/.test(text)) return "vegetarian";
  if (/frozen/.test(text)) return "frozen";
  if (/fresh/.test(text)) return "fresh";
  return "other";
}

export function normaliseCarePackSubtype(
  product: string | null | undefined
): CarePackSubtype {
  const text = (product ?? "").toLowerCase();
  if (/love\s*\+?\s*care/.test(text)) return "love_care_pack";
  if (/care\s*pack(ing)?/.test(text) && !/love/.test(text)) return "care_packing";
  if (/100\s*donated\s*meals|\bdonated\s*meals\b/.test(text)) {
    return "donated_meals_bundle";
  }
  if (/care\s*pack/.test(text)) return "standard";
  return "other";
}

export function subtypeForProduct(
  pool: AllocationPool,
  product: string | null | undefined
): string {
  return pool === "meal"
    ? normaliseMealSubtype(product)
    : normaliseCarePackSubtype(product);
}

export function subtypeLabel(subtype: string): string {
  const labels: Record<string, string> = {
    fresh: "Fresh meals",
    frozen: "Frozen meals",
    kids_friendly: "Kids friendly meals",
    vegetarian: "Vegetarian meals",
    love_care_pack: "Love + care pack",
    care_packing: "Care packing",
    donated_meals_bundle: "Donated meals bundle",
    standard: "Care pack",
    other: "Other",
  };
  return labels[subtype] ?? subtype;
}

export function poolLabel(pool: AllocationPool): string {
  return pool === "meal" ? "Meals" : "Care packs";
}

export function poolFromCategory(
  category: string | null | undefined
): AllocationPool | null {
  if (category === "meal") return "meal";
  if (category === "care_pack") return "care_pack";
  return null;
}

export function isApprovedMealStatus(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "approved";
}

export function isDispatchedCarePackStatus(
  status: string | null | undefined
): boolean {
  return (status ?? "").trim().toLowerCase() === "dispatched";
}

export function isEligibleFulfilmentStatus(
  pool: AllocationPool,
  status: string | null | undefined
): boolean {
  return pool === "meal"
    ? isApprovedMealStatus(status)
    : isDispatchedCarePackStatus(status);
}

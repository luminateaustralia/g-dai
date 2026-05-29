import type { Shelter } from "@/db/schema";

export type ShelterView = {
  id: string;
  displayName: string;
  state: string | null;
  suburb: string | null;
  lga: string | null;
  postcode: string | null;
  region: string | null;
  sensitiveAddress: boolean;
  mealsEligible: boolean | null;
  carepackEligible: boolean | null;
  masked: boolean;
};

const PROTECTED_LABEL = "Protected community partner";

/**
 * Produces a privacy-safe view of a shelter. When a shelter is flagged with a
 * sensitive address and the viewer lacks the `donations.view_sensitive`
 * permission, the name and precise location are withheld and only a coarse
 * region (state) is exposed. This is the single choke point for shelter
 * visibility so donor-facing and aggregate outputs cannot leak addresses.
 */
export function toShelterView(
  shelter: Pick<
    Shelter,
    | "id"
    | "companyName"
    | "state"
    | "suburb"
    | "lga"
    | "postcode"
    | "sensitiveAddress"
    | "mealsEligible"
    | "carepackEligible"
  >,
  canViewSensitive: boolean
): ShelterView {
  const mustMask = shelter.sensitiveAddress && !canViewSensitive;

  return {
    id: shelter.id,
    displayName: mustMask ? PROTECTED_LABEL : shelter.companyName,
    state: shelter.state,
    suburb: mustMask ? null : shelter.suburb,
    lga: mustMask ? null : shelter.lga,
    postcode: mustMask ? null : shelter.postcode,
    region: shelter.state ?? null,
    sensitiveAddress: shelter.sensitiveAddress,
    mealsEligible: shelter.mealsEligible,
    carepackEligible: shelter.carepackEligible,
    masked: mustMask,
  };
}

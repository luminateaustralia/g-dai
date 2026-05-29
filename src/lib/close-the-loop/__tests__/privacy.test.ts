import { describe, expect, it } from "vitest";

import { toShelterView } from "../privacy";

const sensitiveShelter = {
  id: "s1",
  companyName: "Safe Haven Refuge",
  state: "NSW",
  suburb: "Redfern",
  lga: "City of Sydney",
  postcode: "2016",
  sensitiveAddress: true,
  mealsEligible: true,
  carepackEligible: false,
};

const openShelter = { ...sensitiveShelter, id: "s2", sensitiveAddress: false };

describe("toShelterView", () => {
  it("masks sensitive shelters when viewer lacks permission", () => {
    const view = toShelterView(sensitiveShelter, false);
    expect(view.masked).toBe(true);
    expect(view.displayName).not.toContain("Safe Haven");
    expect(view.suburb).toBeNull();
    expect(view.lga).toBeNull();
    expect(view.postcode).toBeNull();
    expect(view.region).toBe("NSW");
  });

  it("reveals sensitive shelters when viewer is permitted", () => {
    const view = toShelterView(sensitiveShelter, true);
    expect(view.masked).toBe(false);
    expect(view.displayName).toBe("Safe Haven Refuge");
    expect(view.suburb).toBe("Redfern");
  });

  it("never masks non-sensitive shelters", () => {
    const view = toShelterView(openShelter, false);
    expect(view.masked).toBe(false);
    expect(view.displayName).toBe("Safe Haven Refuge");
    expect(view.postcode).toBe("2016");
  });
});

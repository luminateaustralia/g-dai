import { describe, expect, it } from "vitest";

import {
  buildShelterLookups,
  resolveShelterId,
} from "../shelter-matching";

describe("resolveShelterId", () => {
  const foundationId = "foundation-id";
  const houseId = "house-id";
  const lookups = buildShelterLookups([
    {
      id: foundationId,
      normalisedName: "gateway",
      postcode: "2131",
    },
    {
      id: houseId,
      normalisedName: "gateway",
      postcode: "2011",
    },
  ]);

  it("disambiguates colliding normalised names using postcode", () => {
    expect(
      resolveShelterId(
        { normalisedShelterName: "gateway", postcode: "2131" },
        lookups
      )
    ).toBe(foundationId);
    expect(
      resolveShelterId(
        { normalisedShelterName: "gateway", postcode: "2011" },
        lookups
      )
    ).toBe(houseId);
  });

  it("returns null when colliding names cannot be disambiguated", () => {
    expect(
      resolveShelterId(
        { normalisedShelterName: "gateway", postcode: null },
        lookups
      )
    ).toBeNull();
  });

  it("resolves unique normalised names without postcode", () => {
    const uniqueLookups = buildShelterLookups([
      {
        id: "maplewood-id",
        normalisedName: "maplewood welfare services",
        postcode: "2010",
      },
    ]);

    expect(
      resolveShelterId(
        { normalisedShelterName: "maplewood welfare services", postcode: null },
        uniqueLookups
      )
    ).toBe("maplewood-id");
  });

  it("falls back to a unique postcode match when name is missing", () => {
    expect(
      resolveShelterId({ normalisedShelterName: "", postcode: "2131" }, lookups)
    ).toBe(foundationId);
  });
});

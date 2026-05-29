import { describe, expect, it } from "vitest";

import {
  normaliseCarePackSubtype,
  normaliseMealSubtype,
} from "../subtypes";
import { weekBoundsFromIsoDate } from "../weeks";

describe("normaliseMealSubtype", () => {
  it("classifies meal product variants", () => {
    expect(normaliseMealSubtype("Donated Meal- FRESH")).toBe("fresh");
    expect(normaliseMealSubtype("Donated Meal- FROZEN")).toBe("frozen");
    expect(normaliseMealSubtype("Donated Meal- FRESH KIDS FRIENDLY")).toBe(
      "kids_friendly"
    );
    expect(normaliseMealSubtype("Donated Meal- FROZEN VEGETARIAN")).toBe(
      "vegetarian"
    );
  });
});

describe("normaliseCarePackSubtype", () => {
  it("classifies care pack product variants", () => {
    expect(normaliseCarePackSubtype("DONATION - LOVE + CARE PACK")).toBe(
      "love_care_pack"
    );
    expect(normaliseCarePackSubtype("CARE PACKING")).toBe("care_packing");
    expect(normaliseCarePackSubtype("100 DONATED MEALS")).toBe(
      "donated_meals_bundle"
    );
  });
});

describe("weekBoundsFromIsoDate", () => {
  it("returns ISO week metadata for a Monday-aligned week", () => {
    const week = weekBoundsFromIsoDate("2026-01-20");
    expect(week).toMatchObject({
      weekStart: "2026-01-19",
      weekEnd: "2026-01-25",
    });
    expect(week?.weekId).toMatch(/^2026-W\d{2}$/);
  });
});

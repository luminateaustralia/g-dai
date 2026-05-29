import { describe, expect, it } from "vitest";

import {
  dayDifference,
  normalisePostcode,
  normaliseProductCategory,
  normaliseShelterName,
  toIsoDate,
} from "../index";

describe("normaliseProductCategory", () => {
  it("classifies meals", () => {
    expect(normaliseProductCategory("Donated Meal- FRESH")).toBe("meal");
    expect(normaliseProductCategory("100 DONATED MEALS")).toBe("meal");
  });

  it("classifies care packs", () => {
    expect(normaliseProductCategory("DONATION - LOVE + CARE PACK")).toBe(
      "care_pack"
    );
    expect(normaliseProductCategory("CARE PACK")).toBe("care_pack");
  });

  it("falls back to other", () => {
    expect(normaliseProductCategory("Gift card")).toBe("other");
    expect(normaliseProductCategory(null, undefined)).toBe("other");
  });

  it("considers multiple hint fields", () => {
    expect(normaliseProductCategory(null, "meal")).toBe("meal");
  });
});

describe("normaliseShelterName", () => {
  it("lowercases and strips noise words and punctuation", () => {
    expect(normaliseShelterName("Gateway Community House")).toBe("gateway");
    expect(normaliseShelterName("Horizon Aid Society Inc.")).toBe(
      "horizon aid society"
    );
  });

  it("expands ampersands", () => {
    expect(normaliseShelterName("Hope & Care")).toBe("hope and care");
  });

  it("handles null", () => {
    expect(normaliseShelterName(null)).toBe("");
  });
});

describe("normalisePostcode", () => {
  it("extracts and pads digits", () => {
    expect(normalisePostcode(2000)).toBe("2000");
    expect(normalisePostcode("NSW 2042")).toBe("2042");
    expect(normalisePostcode("800")).toBe("0800");
  });

  it("returns null for empty", () => {
    expect(normalisePostcode("")).toBeNull();
    expect(normalisePostcode(null)).toBeNull();
  });
});

describe("toIsoDate", () => {
  it("parses dd/mm/yyyy", () => {
    expect(toIsoDate("26/3/2026")).toBe("2026-03-26");
    expect(toIsoDate("22/01/2026 9:00 am")).toBe("2026-01-22");
  });

  it("parses Date objects", () => {
    expect(toIsoDate(new Date(Date.UTC(2026, 4, 20)))).toBe("2026-05-20");
  });

  it("returns null when unparseable", () => {
    expect(toIsoDate("not a date")).toBeNull();
    expect(toIsoDate(null)).toBeNull();
  });
});

describe("dayDifference", () => {
  it("computes absolute day difference", () => {
    expect(dayDifference("2026-01-01", "2026-01-08")).toBe(7);
    expect(dayDifference("2026-01-08", "2026-01-01")).toBe(7);
  });

  it("returns null when a date is missing", () => {
    expect(dayDifference(null, "2026-01-01")).toBeNull();
  });
});

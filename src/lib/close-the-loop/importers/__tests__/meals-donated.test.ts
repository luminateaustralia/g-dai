import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parseMealsDonated } from "../index";

function buildMealsWorkbook(
  rows: Record<string, string | number | null>[]
): XLSX.WorkBook {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Shelter Meals Donated");
  return wb;
}

describe("parseMealsDonated", () => {
  it("imports secondary rows as part of the preceding order", () => {
    const parsed = parseMealsDonated(
      buildMealsWorkbook([
        {
          "Order ID": "1139",
          Customer: "Ashley Alvarez",
          Company: "Maplewood Welfare Services",
          Postcode: 2010,
          "Dispatch Time": "22/01/2026 9:00",
          "Delivery/Pickup Time": "8:30 AM",
          Method: "Delivery",
          "Delivery / Pickup Suburb": "Darlinghurst",
          Qty: 5,
          Product: "Donated Meal- FRESH",
          Status: "Approved",
        },
        {
          Postcode: 2010,
          "Delivery / Pickup Suburb": "Darlinghurst",
          Qty: 10,
          Product: "Donated Meal- FROZEN",
        },
      ])
    );

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      orderId: "1139",
      customerName: "Ashley Alvarez",
      shelterNameRaw: "Maplewood Welfare Services",
      quantity: 5,
      product: "Donated Meal- FRESH",
      status: "Approved",
    });
    expect(parsed[1]).toMatchObject({
      orderId: "1139",
      customerName: "Ashley Alvarez",
      shelterNameRaw: "Maplewood Welfare Services",
      quantity: 10,
      product: "Donated Meal- FROZEN",
      status: "Approved",
      deliverySuburb: "Darlinghurst",
    });
  });

  it("starts a new group when the next primary row appears", () => {
    const parsed = parseMealsDonated(
      buildMealsWorkbook([
        {
          "Order ID": "1139",
          Company: "Maplewood Welfare Services",
          Qty: 5,
          Product: "Donated Meal- FRESH",
        },
        {
          Qty: 10,
          Product: "Donated Meal- FROZEN",
        },
        {
          "Order ID": "1140",
          Company: "Horizon Aid Society",
          Qty: 3,
          Product: "Donated Meal- FRESH",
        },
      ])
    );

    expect(parsed).toHaveLength(3);
    expect(parsed[1].orderId).toBe("1139");
    expect(parsed[2]).toMatchObject({
      orderId: "1140",
      shelterNameRaw: "Horizon Aid Society",
      quantity: 3,
    });
  });

  it("skips orphan line items before any primary row", () => {
    const parsed = parseMealsDonated(
      buildMealsWorkbook([
        {
          Qty: 10,
          Product: "Donated Meal- FROZEN",
        },
        {
          "Order ID": "1139",
          Company: "Maplewood Welfare Services",
          Qty: 5,
          Product: "Donated Meal- FRESH",
        },
      ])
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0].orderId).toBe("1139");
  });
});

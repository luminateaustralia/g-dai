import type * as XLSX from "xlsx";

import {
  asNumber,
  asString,
  asBoolean,
  findSheetName,
  pick,
  sheetRows,
  type SheetRow,
} from "@/lib/ingestion/workbook";
import {
  normaliseProductCategory,
  normalisePostcode,
  normaliseShelterName,
  toIsoDate,
} from "@/lib/close-the-loop/normalisation";
import type { DonationCategory, FulfilmentSource } from "@/db/schema";

export type ParsedOrder = {
  orderId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  product: string | null;
  productCategory: DonationCategory;
  totalQuantity: number | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  rawData: string;
};

export type ParsedShelter = {
  companyName: string;
  normalisedName: string;
  state: string | null;
  suburb: string | null;
  lga: string | null;
  postcode: string | null;
  mealsEligible: boolean | null;
  carepackEligible: boolean | null;
  sensitiveAddress: boolean;
};

export type ParsedFulfilment = {
  source: FulfilmentSource;
  orderId: string | null;
  invoiceNo: string | null;
  customerName: string | null;
  shelterNameRaw: string | null;
  normalisedShelterName: string;
  postcode: string | null;
  product: string | null;
  productCategory: DonationCategory;
  quantity: number | null;
  method: string | null;
  deliverySuburb: string | null;
  dispatchDate: string | null;
  fulfilmentDate: string | null;
  status: string | null;
  rawData: string;
};

export function parseCustomerOrders(wb: XLSX.WorkBook): ParsedOrder[] {
  const sheet = findSheetName(wb, ["Customer orders", "Customer Orders"]);
  if (!sheet) return [];
  return sheetRows(wb, sheet)
    .map((row): ParsedOrder | null => {
      const orderId = asString(pick(row, "Order ID", "OrderID", "Order"));
      const product = asString(pick(row, "Product"));
      if (!orderId && !product) return null;
      return {
        orderId,
        firstName: asString(pick(row, "First Name", "FirstName")),
        lastName: asString(pick(row, "Last Name", "LastName")),
        email: asString(pick(row, "Customer Email", "Email")),
        product,
        productCategory: normaliseProductCategory(product),
        totalQuantity: asNumber(pick(row, "Total Quantity", "Quantity", "Qty")),
        suburb: asString(pick(row, "Suburb")),
        state: asString(pick(row, "State")),
        postcode: normalisePostcode(pick(row, "Postal Code", "Postcode")),
        rawData: JSON.stringify(row),
      };
    })
    .filter((o): o is ParsedOrder => o !== null);
}

export function parseShelters(wb: XLSX.WorkBook): ParsedShelter[] {
  const sheet = findSheetName(wb, ["Shelters", "Shelter"]);
  if (!sheet) return [];
  return sheetRows(wb, sheet)
    .map((row): ParsedShelter | null => {
      const companyName = asString(pick(row, "Company Name", "Company"));
      if (!companyName) return null;
      return {
        companyName,
        normalisedName: normaliseShelterName(companyName),
        state: asString(pick(row, "State", "STATE")),
        suburb: asString(pick(row, "Suburb", "SUBURB")),
        lga: asString(pick(row, "LGA")),
        postcode: normalisePostcode(pick(row, "Postcode", "Postal Code")),
        mealsEligible: asBoolean(pick(row, "Meals", "Meal")),
        carepackEligible: asBoolean(pick(row, "Carepack", "Care Pack", "Carepak")),
        sensitiveAddress:
          asBoolean(pick(row, "Sensitive Address", "Sensitive")) === true,
      };
    })
    .filter((s): s is ParsedShelter => s !== null);
}

type MealsRowContext = {
  orderId: string | null;
  customerName: string | null;
  shelterNameRaw: string | null;
  normalisedShelterName: string;
  postcode: string | null;
  method: string | null;
  deliverySuburb: string | null;
  dispatchDate: string | null;
  fulfilmentDate: string | null;
  status: string | null;
};

function emptyMealsContext(): MealsRowContext {
  return {
    orderId: null,
    customerName: null,
    shelterNameRaw: null,
    normalisedShelterName: "",
    postcode: null,
    method: null,
    deliverySuburb: null,
    dispatchDate: null,
    fulfilmentDate: null,
    status: null,
  };
}

function readMealsRowFields(row: SheetRow) {
  return {
    orderId: asString(pick(row, "Order ID", "OrderID")),
    customerName: asString(pick(row, "Customer")),
    shelterNameRaw: asString(pick(row, "Company")),
    postcode: normalisePostcode(pick(row, "Postcode", "Postal Code")),
    method: asString(pick(row, "Method")),
    deliverySuburb: asString(
      pick(row, "Delivery / Pickup Suburb", "Delivery/Pickup Suburb")
    ),
    dispatchDate: toIsoDate(pick(row, "Dispatch Time", "Dispatch")),
    fulfilmentDate: toIsoDate(
      pick(row, "Delivery/Pickup Time", "Delivery / Pickup Time")
    ),
    status: asString(pick(row, "Status")),
    product: asString(pick(row, "Product")),
    quantity: asNumber(pick(row, "Qty", "Quantity")),
  };
}

export function parseMealsDonated(wb: XLSX.WorkBook): ParsedFulfilment[] {
  const sheet = findSheetName(wb, [
    "Shelter Meals Donated",
    "Meals Donated",
    "Shelter Meals",
  ]);
  if (!sheet) return [];

  const context = emptyMealsContext();
  const results: ParsedFulfilment[] = [];

  for (const row of sheetRows(wb, sheet)) {
    const fields = readMealsRowFields(row);
    if (!fields.product && fields.quantity === null) continue;

    // Primary rows carry order / shelter header fields; secondary rows inherit them.
    if (fields.orderId || fields.shelterNameRaw) {
      if (fields.orderId) context.orderId = fields.orderId;
      if (fields.shelterNameRaw) {
        context.shelterNameRaw = fields.shelterNameRaw;
        context.normalisedShelterName = normaliseShelterName(fields.shelterNameRaw);
      }
      if (fields.customerName) context.customerName = fields.customerName;
      if (fields.postcode) context.postcode = fields.postcode;
      if (fields.method) context.method = fields.method;
      if (fields.deliverySuburb) context.deliverySuburb = fields.deliverySuburb;
      if (fields.dispatchDate) context.dispatchDate = fields.dispatchDate;
      if (fields.fulfilmentDate) context.fulfilmentDate = fields.fulfilmentDate;
      if (fields.status) context.status = fields.status;
    }

    const orderId = fields.orderId ?? context.orderId;
    const shelterNameRaw = fields.shelterNameRaw ?? context.shelterNameRaw;
    if (!orderId && !shelterNameRaw) continue;

    results.push({
      source: "meal",
      orderId,
      invoiceNo: null,
      customerName: fields.customerName ?? context.customerName,
      shelterNameRaw,
      normalisedShelterName: fields.shelterNameRaw
        ? normaliseShelterName(fields.shelterNameRaw)
        : context.normalisedShelterName,
      postcode: fields.postcode ?? context.postcode,
      product: fields.product,
      productCategory: normaliseProductCategory(fields.product, "meal"),
      quantity: fields.quantity,
      method: fields.method ?? context.method,
      deliverySuburb: fields.deliverySuburb ?? context.deliverySuburb,
      dispatchDate: fields.dispatchDate ?? context.dispatchDate,
      fulfilmentDate: fields.fulfilmentDate ?? context.fulfilmentDate,
      status: fields.status ?? context.status,
      rawData: JSON.stringify(row),
    });
  }

  return results;
}

export function parseCarepakDonated(wb: XLSX.WorkBook): ParsedFulfilment[] {
  const sheet = findSheetName(wb, [
    "Shelter Carepak Donated",
    "Carepak Donated",
    "Shelter Carepak",
  ]);
  if (!sheet) return [];
  return sheetRows(wb, sheet)
    .map((row): ParsedFulfilment | null => {
      // For care packs the "Customer" column holds the recipient shelter.
      const shelterRaw = asString(pick(row, "Customer", "Company"));
      if (!shelterRaw) return null;
      const product = asString(pick(row, "Product"));
      const category = asString(pick(row, "Product Category"));
      return {
        source: "carepak",
        orderId: asString(pick(row, "Order ID", "OrderID")),
        invoiceNo: asString(pick(row, "Invoice No", "Invoice Number")),
        customerName: shelterRaw,
        shelterNameRaw: shelterRaw,
        normalisedShelterName: normaliseShelterName(shelterRaw),
        postcode: normalisePostcode(pick(row, "PostalCode", "Postal Code", "Postcode")),
        product,
        productCategory: normaliseProductCategory(product, category, "care_pack"),
        quantity: asNumber(pick(row, "Qty", "Quantity")),
        method: null,
        deliverySuburb: null,
        dispatchDate: toIsoDate(pick(row, "InvoiceDate", "Invoice Date")),
        fulfilmentDate: toIsoDate(pick(row, "InvoiceDate", "Invoice Date")),
        status: asString(pick(row, "Status")),
        rawData: JSON.stringify(row),
      };
    })
    .filter((f): f is ParsedFulfilment => f !== null);
}

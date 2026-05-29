import * as XLSX from "xlsx";

export const DEMO_WORKBOOK_FILENAME = "close-the-loop-demo-scenario.xlsx";

export function buildDemoWorkbookBuffer(): ArrayBuffer {
  const customerOrders = [
    {
      "Order ID": "4001",
      "First Name": "Sarah",
      "Last Name": "Nguyen",
      "Customer Email": "sarah.nguyen@example.com",
      Product: "Donate a Meal To A Women's Shelter",
      "Total Quantity": 15,
      Suburb: "Surry Hills",
      State: "NSW",
      "Postal Code": "2010",
    },
    {
      "Order ID": "4002",
      "First Name": "Sarah",
      "Last Name": "Nguyen",
      "Customer Email": "sarah.nguyen@example.com",
      Product: "Donate a Meal To A Women's Shelter",
      "Total Quantity": 10,
      Suburb: "Surry Hills",
      State: "NSW",
      "Postal Code": "2010",
    },
    {
      "Order ID": "4003",
      "First Name": "James",
      "Last Name": "Patel",
      "Customer Email": "james.patel@example.com",
      Product: "Donate a Meal To A Women's Shelter",
      "Total Quantity": 50,
      Suburb: "Parramatta",
      State: "NSW",
      "Postal Code": "2150",
    },
    {
      "Order ID": "5001",
      "First Name": "Emma",
      "Last Name": "Walsh",
      "Customer Email": "emma.walsh@example.com",
      Product: "CARE PACK",
      "Total Quantity": 8,
      Suburb: "Newtown",
      State: "NSW",
      "Postal Code": "2042",
    },
    {
      "Order ID": "5002",
      "First Name": "Michael",
      "Last Name": "Chen",
      "Customer Email": "michael.chen@example.com",
      Product: "CARE PACK",
      "Total Quantity": 5,
      Suburb: "Chatswood",
      State: "NSW",
      "Postal Code": "2067",
    },
  ];

  const shelters = [
    {
      "Company Name": "Maplewood Welfare Services",
      Postcode: "2010",
      Suburb: "Darlinghurst",
      LGA: "Sydney",
      State: "NSW",
      Meals: "Yes",
      Carepack: "Yes",
      "Sensitive Address": "No",
    },
    {
      "Company Name": "Horizon Aid Society",
      Postcode: "2150",
      Suburb: "Parramatta",
      LGA: "Parramatta",
      State: "NSW",
      Meals: "Yes",
      Carepack: "No",
      "Sensitive Address": "No",
    },
    {
      "Company Name": "Safe Haven Refuge",
      Postcode: "2042",
      Suburb: "Newtown",
      LGA: "Inner West",
      State: "NSW",
      Meals: "Yes",
      Carepack: "Yes",
      "Sensitive Address": "Yes",
    },
  ];

  const mealsDonated = [
    {
      "Order ID": "1139",
      Customer: "Ashley Alvarez",
      Company: "Maplewood Welfare Services",
      Postcode: "2010",
      "Dispatch Time": "19/01/2026 9:00",
      "Delivery/Pickup Time": "20/01/2026 8:30",
      Method: "Delivery",
      "Delivery / Pickup Suburb": "Darlinghurst",
      Qty: 10,
      Product: "Donated Meal- FRESH",
      Status: "Approved",
    },
    {
      Postcode: "2010",
      "Delivery / Pickup Suburb": "Darlinghurst",
      Qty: 5,
      Product: "Donated Meal- FROZEN",
    },
    {
      "Order ID": "1140",
      Customer: "Jordan Lee",
      Company: "Horizon Aid Society",
      Postcode: "2150",
      "Dispatch Time": "20/01/2026 9:00",
      "Delivery/Pickup Time": "21/01/2026 8:30",
      Method: "Delivery",
      "Delivery / Pickup Suburb": "Parramatta",
      Qty: 20,
      Product: "Donated Meal- FRESH",
      Status: "Approved",
    },
    {
      "Order ID": "1141",
      Customer: "Priya Shah",
      Company: "Safe Haven Refuge",
      Postcode: "2042",
      "Dispatch Time": "26/01/2026 9:00",
      "Delivery/Pickup Time": "27/01/2026 8:30",
      Method: "Delivery",
      "Delivery / Pickup Suburb": "Newtown",
      Qty: 12,
      Product: "Donated Meal- FRESH",
      Status: "Approved",
    },
    {
      "Order ID": "1142",
      Customer: "Priya Shah",
      Company: "Safe Haven Refuge",
      Postcode: "2042",
      "Dispatch Time": "02/02/2026 9:00",
      "Delivery/Pickup Time": "03/02/2026 8:30",
      Method: "Delivery",
      "Delivery / Pickup Suburb": "Newtown",
      Qty: 40,
      Product: "Donated Meal- FRESH",
      Status: "Approved",
    },
  ];

  const carepakDonated = [
    {
      Customer: "Maplewood Welfare Services",
      Product: "DONATION - LOVE + CARE PACK",
      "Invoice No": "CP-1001",
      InvoiceDate: "21/01/2026",
      Qty: 5,
      Status: "Dispatched",
    },
    {
      Customer: "Safe Haven Refuge",
      Product: "CARE PACKING",
      "Invoice No": "CP-1002",
      InvoiceDate: "28/01/2026",
      Qty: 6,
      Status: "Dispatched",
    },
    {
      Customer: "Maplewood Welfare Services",
      Product: "DONATION - LOVE + CARE PACK",
      "Invoice No": "CP-1003",
      InvoiceDate: "04/02/2026",
      Qty: 10,
      Status: "Dispatched",
    },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(customerOrders),
    "Customer Orders"
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shelters), "Shelters");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(mealsDonated),
    "Shelter Meals Donated"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(carepakDonated),
    "Shelter Carepak Donated"
  );

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

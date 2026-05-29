import type { AllocationPool } from "@/db/schema";

export type DonorSupplyOrder = {
  internalId: string;
  orderId: string | null;
  donorName: string;
  donorEmail: string | null;
  pool: AllocationPool;
  qtyDonated: number;
  remainingQty: number;
};

export type ShelterDemandBucket = {
  key: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  pool: AllocationPool;
  subtype: string;
  shelterId: string;
  shelterName: string;
  shelterSuburb: string | null;
  shelterSensitive: boolean;
  demandQty: number;
  flexOrderIds: string[];
  flexInvoiceNos: string[];
};

export type AllocationLedgerEntry = {
  allocationId: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  pool: AllocationPool;
  productSubtype: string;
  donorOrderId: string | null;
  donorName: string | null;
  donorEmail: string | null;
  qtyDonated: number | null;
  qtyAllocatedThisWeek: number;
  carryForwardBalance: number | null;
  flexOrderId: string | null;
  shelterId: string;
  shelterName: string;
  shelterSuburb: string | null;
  shelterSensitive: boolean;
  mealsFulfilled: number;
  tooGoodGapFill: boolean;
  gapQty: number;
};

export type CarryForwardSnapshot = {
  pool: AllocationPool;
  donorOrderId: string;
  weekId: string;
  remainingQty: number;
};

export type AllocationResult = {
  ledger: AllocationLedgerEntry[];
  carryForward: CarryForwardSnapshot[];
  weeks: Array<{
    pool: AllocationPool;
    weekId: string;
    weekStart: string;
    weekEnd: string;
  }>;
  summary: {
    totalAllocated: number;
    totalGap: number;
    carryForwardTotal: number;
    byPool: Record<
      AllocationPool,
      { allocated: number; gap: number; carryForward: number }
    >;
  };
};

export type FulfilmentInput = {
  id: string;
  pool: AllocationPool;
  product: string | null;
  quantity: number | null;
  status: string | null;
  fulfilmentDate: string | null;
  orderId: string | null;
  invoiceNo: string | null;
  shelterId: string | null;
  shelterName: string;
  shelterSuburb: string | null;
  shelterSensitive: boolean;
};

export type OrderInput = {
  internalId: string;
  orderId: string | null;
  donorName: string;
  donorEmail: string | null;
  pool: AllocationPool;
  totalQuantity: number | null;
};

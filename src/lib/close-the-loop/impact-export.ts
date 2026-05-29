import type { LedgerRow } from "@/lib/close-the-loop/queries";

export type ImpactRecord = {
  donorId: string | null;
  donorName: string;
  donationType: string;
  quantity: number | null;
  supported: string;
  region: string;
  approximatePeriod: string;
  matchConfidence: "Confirmed" | "Likely";
};

export function formatApproximatePeriod(date: string | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function ledgerRowToImpactRecord(row: LedgerRow): ImpactRecord | null {
  if (row.status !== "matched" && row.status !== "partial") return null;

  return {
    donorId: row.donorId,
    donorName: row.donorName ?? "Supporter",
    donationType: row.productCategory === "meal" ? "Meals" : "Care pack",
    quantity: row.quantity,
    supported: row.shelter?.displayName ?? "A community partner",
    region: row.shelter?.region ?? "",
    approximatePeriod: formatApproximatePeriod(
      row.fulfilmentDate ?? row.dispatchDate
    ),
    matchConfidence: row.status === "matched" ? "Confirmed" : "Likely",
  };
}

export function buildImpactRecords(ledger: LedgerRow[]): ImpactRecord[] {
  return ledger
    .map(ledgerRowToImpactRecord)
    .filter((record): record is ImpactRecord => record !== null);
}

export function impactRecordToCsvRow(record: ImpactRecord) {
  return {
    Donor: record.donorName,
    "Donation type": record.donationType,
    Quantity: record.quantity ?? "",
    Supported: record.supported,
    Region: record.region,
    "Approximate period": record.approximatePeriod,
    "Match confidence": record.matchConfidence,
  };
}

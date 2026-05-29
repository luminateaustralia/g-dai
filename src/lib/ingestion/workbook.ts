import * as XLSX from "xlsx";

export type SheetRow = Record<string, unknown>;

export function readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "array", cellDates: true });
}

/**
 * Finds a sheet by case-insensitive, whitespace-insensitive name match so
 * minor heading drift between quarters does not break ingestion.
 */
export function findSheetName(
  wb: XLSX.WorkBook,
  candidates: string[]
): string | undefined {
  const normalised = wb.SheetNames.map((name) => ({
    name,
    key: normaliseKey(name),
  }));
  for (const candidate of candidates) {
    const key = normaliseKey(candidate);
    const found = normalised.find((s) => s.key === key);
    if (found) return found.name;
  }
  return undefined;
}

export function sheetRows(wb: XLSX.WorkBook, sheetName: string): SheetRow[] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    defval: null,
    raw: true,
    blankrows: false,
  });
}

/**
 * Returns a sheet as an array-of-arrays preserving row/column position. Used
 * for sheets with multi-row / merged headers (e.g. the Personal Wellbeing Index
 * Client Tracker "Data Entry" sheet)
 * where positional parsing is required.
 */
export function sheetMatrix(wb: XLSX.WorkBook, sheetName: string): unknown[][] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: true,
  });
}

/** Normalises a header/key for tolerant lookups: lowercase, alphanumeric only. */
export function normaliseKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Reads a value from a row by trying several possible header names, each
 * matched tolerantly. Returns the first non-empty match.
 */
export function pick(row: SheetRow, ...headers: string[]): unknown {
  const entries = Object.entries(row).map(([k, v]) => ({
    key: normaliseKey(k),
    value: v,
  }));
  for (const header of headers) {
    const target = normaliseKey(header);
    const hit = entries.find((e) => e.key === target);
    if (hit && hit.value !== null && hit.value !== "") return hit.value;
  }
  return null;
}

export function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  const str = String(value).trim();
  return str.length ? str : null;
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, "");
  if (!cleaned.length) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Interprets common spreadsheet truthy markers (Yes/Y/True/1/✓) as booleans.
 * Returns null when the cell is blank or unrecognised.
 */
export function asBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const str = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1", "✓", "x", "eligible", "completed"].includes(str))
    return true;
  if (["no", "n", "false", "0", "-", "not eligible"].includes(str)) return false;
  return null;
}

export async function computeChecksum(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

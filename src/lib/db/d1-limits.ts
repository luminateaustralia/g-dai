/** Cloudflare D1 allows at most 100 bound parameters per prepared statement. */
export const D1_MAX_PARAMS = 100;

/**
 * Max rows per multi-row insert without exceeding D1's parameter limit.
 * Count every column Drizzle binds — including `$defaultFn` and `.default()`
 * columns not explicitly set in `.values()`.
 */
export function d1InsertChunkSize(columnCount: number): number {
  const safeLimit = D1_MAX_PARAMS - 1;
  return Math.max(1, Math.floor(safeLimit / columnCount));
}

/** Max values per SQL `IN (...)` clause on D1 (one bind parameter per value). */
export const D1_IN_CLAUSE_CHUNK = d1InsertChunkSize(1);

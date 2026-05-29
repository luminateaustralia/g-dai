import { D1_IN_CLAUSE_CHUNK } from "@/lib/db/d1-limits";

export async function queryInChunks<T, V>(
  values: V[],
  run: (chunk: V[]) => Promise<T[]>
): Promise<T[]> {
  if (!values.length) return [];
  const out: T[] = [];
  for (let i = 0; i < values.length; i += D1_IN_CLAUSE_CHUNK) {
    out.push(...(await run(values.slice(i, i + D1_IN_CLAUSE_CHUNK))));
  }
  return out;
}

export async function execInChunks<V>(
  values: V[],
  run: (chunk: V[]) => Promise<unknown>
): Promise<void> {
  for (let i = 0; i < values.length; i += D1_IN_CLAUSE_CHUNK) {
    await run(values.slice(i, i + D1_IN_CLAUSE_CHUNK));
  }
}

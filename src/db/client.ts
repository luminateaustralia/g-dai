import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Returns a Drizzle client bound to the Cloudflare D1 `DB` binding for the
 * current request. Uses the async context accessor so it is safe to call from
 * server components, route handlers and server actions.
 */
export async function getDb(): Promise<Database> {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export { schema };

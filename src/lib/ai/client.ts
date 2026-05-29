import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Returns the Cloudflare Workers AI binding for the current request.
 */
export async function getAi(): Promise<Ai> {
  const { env } = await getCloudflareContext({ async: true });

  if (!env.AI) {
    throw new Error(
      "Workers AI binding is not available. Check wrangler.jsonc includes an ai binding and restart the dev server."
    );
  }

  return env.AI;
}

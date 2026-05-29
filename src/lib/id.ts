/**
 * Generates a stable unique identifier for database rows. Uses the Web Crypto
 * API available in the Workers runtime.
 */
export function newId(): string {
  return crypto.randomUUID();
}

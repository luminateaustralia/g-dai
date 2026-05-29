import { getCloudflareContext } from "@opennextjs/cloudflare";

export type EmailEnv = {
  resendApiKey: string;
  fromEmail: string;
};

export async function getEmailEnv(): Promise<EmailEnv> {
  const { env } = await getCloudflareContext({ async: true });
  const resendApiKey = env.RESEND_API_KEY ?? process.env.RESEND_API_KEY ?? "";
  const fromEmail = env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "";

  if (!resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to .dev.vars locally or as a Wrangler secret in production."
    );
  }

  if (!fromEmail) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured. Example: Two Good Co <hello@twogood.com.au>"
    );
  }

  return { resendApiKey, fromEmail };
}

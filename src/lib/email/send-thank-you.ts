import { Resend } from "resend";

import { getEmailEnv } from "@/lib/email/env";
import {
  renderThankYouEmailHtml,
  renderThankYouEmailText,
  thankYouEmailSubject,
  type ThankYouEmailInput,
} from "@/lib/email/thank-you-template";

export type SendThankYouEmailInput = ThankYouEmailInput & {
  to: string;
};

export async function sendThankYouEmail(input: SendThankYouEmailInput) {
  const { resendApiKey, fromEmail } = await getEmailEnv();
  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: thankYouEmailSubject(),
    html: renderThankYouEmailHtml(input),
    text: renderThankYouEmailText(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export {
  renderThankYouEmailHtml,
  renderThankYouEmailText,
  thankYouEmailSubject,
  type ThankYouEmailInput,
};

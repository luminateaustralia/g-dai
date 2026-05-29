import type { DonorImpactReport } from "@/lib/donations-beta/reports/build-donor-report";

export function impactReportSubject(): string {
  return "Your donation impact report from Two Good Co";
}

export function renderImpactReportEmailHtml(
  report: DonorImpactReport,
  reportUrl: string
) {
  const greeting = report.firstName ? `Hi ${report.firstName},` : "Hi there,";
  const mealLine =
    report.totalMeals > 0
      ? `<li><strong>${report.totalMeals}</strong> meals allocated to shelters</li>`
      : "";
  const carePackLine =
    report.totalCarePacks > 0
      ? `<li><strong>${report.totalCarePacks}</strong> care packs allocated to shelters</li>`
      : "";

  return `<!DOCTYPE html>
<html lang="en-AU">
  <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
    <p>${greeting}</p>
    <p>Thank you for supporting women&apos;s shelters through Too Good Co. Here is a summary of the impact your donations helped create:</p>
    <ul>${mealLine}${carePackLine}</ul>
    <p>Your personalised report includes the shelters that benefited and the fulfilment weeks we matched.</p>
    <p><a href="${reportUrl}">View your impact report</a></p>
    <p>With gratitude,<br/>Two Good Co</p>
  </body>
</html>`;
}

export function renderImpactReportEmailText(
  report: DonorImpactReport,
  reportUrl: string
) {
  const greeting = report.firstName ? `Hi ${report.firstName},` : "Hi there,";
  const lines = [
    greeting,
    "",
    "Thank you for supporting women's shelters through Too Good Co.",
    "",
  ];

  if (report.totalMeals > 0) {
    lines.push(`${report.totalMeals} meals allocated to shelters.`);
  }
  if (report.totalCarePacks > 0) {
    lines.push(`${report.totalCarePacks} care packs allocated to shelters.`);
  }

  lines.push("", `View your impact report: ${reportUrl}`, "", "With gratitude,", "Two Good Co");
  return lines.join("\n");
}

export async function sendImpactReportEmail(input: {
  to: string;
  report: DonorImpactReport;
  reportUrl: string;
}) {
  const { Resend } = await import("resend");
  const { getEmailEnv } = await import("@/lib/email/env");
  const { resendApiKey, fromEmail } = await getEmailEnv();
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: impactReportSubject(),
    html: renderImpactReportEmailHtml(input.report, input.reportUrl),
    text: renderImpactReportEmailText(input.report, input.reportUrl),
  });

  if (error) {
    throw new Error(error.message);
  }
}

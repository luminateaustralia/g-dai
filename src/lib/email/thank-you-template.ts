import type { ImpactRecord } from "@/lib/close-the-loop/impact-export";
import { TWO_GOOD_BRAND } from "@/lib/email/brand";

export type ThankYouEmailInput = {
  donorFirstName: string | null;
  donorName: string;
  records: ImpactRecord[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function greeting(input: ThankYouEmailInput): string {
  const firstName = input.donorFirstName?.trim();
  if (firstName) return `Hi ${escapeHtml(firstName)},`;
  const name = input.donorName.trim();
  if (name && name !== "Supporter") return `Hi ${escapeHtml(name)},`;
  return "Hi there,";
}

function impactRowsHtml(records: ImpactRecord[]): string {
  const rows = records
    .map(
      (record) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${TWO_GOOD_BRAND.accentColour};font-size:14px;color:${TWO_GOOD_BRAND.primaryColour};">
            ${escapeHtml(record.donationType)}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid ${TWO_GOOD_BRAND.accentColour};font-size:14px;color:${TWO_GOOD_BRAND.primaryColour};text-align:right;">
            ${record.quantity ?? "—"}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid ${TWO_GOOD_BRAND.accentColour};font-size:14px;color:${TWO_GOOD_BRAND.primaryColour};">
            ${escapeHtml(record.supported)}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid ${TWO_GOOD_BRAND.accentColour};font-size:14px;color:${TWO_GOOD_BRAND.mutedColour};">
            ${escapeHtml(record.region || "—")}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid ${TWO_GOOD_BRAND.accentColour};font-size:14px;color:${TWO_GOOD_BRAND.mutedColour};">
            ${escapeHtml(record.approximatePeriod)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;background:${TWO_GOOD_BRAND.cardColour};border:1px solid ${TWO_GOOD_BRAND.accentColour};border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:${TWO_GOOD_BRAND.backgroundColour};">
          <th align="left" style="padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">Donation type</th>
          <th align="right" style="padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">Quantity</th>
          <th align="left" style="padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">Supported</th>
          <th align="left" style="padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">Region</th>
          <th align="left" style="padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">Approximate period</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

export function thankYouEmailSubject(): string {
  return "Thank you for changing the course of someone's life";
}

export function renderThankYouEmailHtml(input: ThankYouEmailInput): string {
  const itemCount = input.records.length;
  const itemLabel = itemCount === 1 ? "donation" : "donations";

  return `<!DOCTYPE html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(thankYouEmailSubject())}</title>
  </head>
  <body style="margin:0;padding:0;background:${TWO_GOOD_BRAND.backgroundColour};font-family:Georgia, 'Times New Roman', serif;color:${TWO_GOOD_BRAND.primaryColour};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TWO_GOOD_BRAND.backgroundColour};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${TWO_GOOD_BRAND.cardColour};border-radius:12px;overflow:hidden;border:1px solid ${TWO_GOOD_BRAND.accentColour};">
            <tr>
              <td style="padding:32px 32px 24px;text-align:center;background:${TWO_GOOD_BRAND.cardColour};">
                <img src="${TWO_GOOD_BRAND.logoUrl}" alt="${escapeHtml(TWO_GOOD_BRAND.name)}" width="106" height="83" style="display:inline-block;max-width:106px;height:auto;" />
                <p style="margin:16px 0 0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${TWO_GOOD_BRAND.mutedColour};">
                  ${escapeHtml(TWO_GOOD_BRAND.tagline)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-family:Arial, Helvetica, sans-serif;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${TWO_GOOD_BRAND.primaryColour};">
                  ${greeting(input)}
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${TWO_GOOD_BRAND.primaryColour};">
                  Thank you for choosing to Buy Good Do Good. With every purchase, you help change the course of someone&rsquo;s life &mdash; and we wanted you to know the difference your support has made.
                </p>
                <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${TWO_GOOD_BRAND.primaryColour};">
                  Based on our latest traceability data, your ${itemCount} ${itemLabel} supported women and community partners across Australia:
                </p>
                ${impactRowsHtml(input.records)}
                <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${TWO_GOOD_BRAND.primaryColour};">
                  We believe in people, until they believe in themselves again. Your generosity helps fund meals, gifts and employment pathways for women rebuilding after domestic violence and homelessness.
                </p>
                <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${TWO_GOOD_BRAND.primaryColour};">
                  With gratitude,<br />
                  <strong>The ${escapeHtml(TWO_GOOD_BRAND.name)} team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:${TWO_GOOD_BRAND.backgroundColour};font-family:Arial, Helvetica, sans-serif;text-align:center;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${TWO_GOOD_BRAND.mutedColour};">
                  ${escapeHtml(TWO_GOOD_BRAND.name)} &middot; ${escapeHtml(TWO_GOOD_BRAND.tagline)}
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;">
                  <a href="${TWO_GOOD_BRAND.website}" style="color:${TWO_GOOD_BRAND.primaryColour};text-decoration:underline;">
                    twogood.com.au
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderThankYouEmailText(input: ThankYouEmailInput): string {
  const greetingLine = input.donorFirstName?.trim()
    ? `Hi ${input.donorFirstName.trim()},`
    : input.donorName.trim() && input.donorName !== "Supporter"
      ? `Hi ${input.donorName.trim()},`
      : "Hi there,";

  const lines = [
    greetingLine,
    "",
    "Thank you for choosing to Buy Good Do Good. With every purchase, you help change the course of someone's life — and we wanted you to know the difference your support has made.",
    "",
    "Your impact:",
    ...input.records.map(
      (record) =>
        `- ${record.donationType} (qty ${record.quantity ?? "—"}) → ${record.supported}${record.region ? `, ${record.region}` : ""} (${record.approximatePeriod})`
    ),
    "",
    "We believe in people, until they believe in themselves again. Your generosity helps fund meals, gifts and employment pathways for women rebuilding after domestic violence and homelessness.",
    "",
    `With gratitude,`,
    `The ${TWO_GOOD_BRAND.name} team`,
    "",
    TWO_GOOD_BRAND.website,
  ];

  return lines.join("\n");
}

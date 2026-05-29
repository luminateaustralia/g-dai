"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { writeAudit } from "@/lib/audit";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import { getThankYouRecipient } from "@/lib/close-the-loop/thank-you-recipients";
import {
  renderThankYouEmailHtml,
  sendThankYouEmail,
  thankYouEmailSubject,
} from "@/lib/email/send-thank-you";

export type ThankYouPreview = {
  subject: string;
  html: string;
  to: string;
  donorName: string;
};

export async function previewThankYouEmailAction(
  donorId: string
): Promise<ThankYouPreview> {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot send thank-you emails.");
  }

  const db = await getDb();
  const latest = await getLatestDonationImport(db);
  if (!latest) throw new Error("No donation data imported.");

  const recipient = await getThankYouRecipient(db, latest.id, donorId, {
    requireSendable: false,
  });
  if (!recipient) {
    throw new Error("This donor does not have a thank-you email on file.");
  }

  return {
    subject: thankYouEmailSubject(),
    html: renderThankYouEmailHtml({
      donorFirstName: recipient.firstName,
      donorName: recipient.donorName,
      records: recipient.records,
    }),
    to: recipient.email,
    donorName: recipient.donorName,
  };
}

export async function sendThankYouEmailAction(donorId: string) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "donations.resolve")) {
    throw new Error("Your role cannot send thank-you emails.");
  }

  const db = await getDb();
  const latest = await getLatestDonationImport(db);
  if (!latest) throw new Error("No donation data imported.");

  const recipient = await getThankYouRecipient(db, latest.id, donorId);
  if (!recipient) {
    throw new Error("This donor is not eligible for a thank-you email.");
  }

  const result = await sendThankYouEmail({
    to: recipient.email,
    donorFirstName: recipient.firstName,
    donorName: recipient.donorName,
    records: recipient.records,
  });

  await writeAudit(db, {
    actor: user,
    action: "donations.thank_you_sent",
    entityType: "donor",
    entityId: recipient.donorId,
    detail: {
      importId: latest.id,
      email: recipient.email,
      resendId: result?.id ?? null,
      recordCount: recipient.records.length,
    },
  });

  revalidatePath("/donations/thank-you");
}

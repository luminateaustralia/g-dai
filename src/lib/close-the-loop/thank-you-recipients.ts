import { desc, eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { auditLog, donor } from "@/db/schema";
import {
  buildImpactRecords,
  type ImpactRecord,
} from "@/lib/close-the-loop/impact-export";
import { buildLedger } from "@/lib/close-the-loop/queries";

export type ThankYouRecipient = {
  donorId: string;
  donorName: string;
  email: string;
  firstName: string | null;
  records: ImpactRecord[];
  sentAt: string | null;
};

export type ThankYouRecipientCandidate = {
  donorId: string | null;
  donorName: string;
  email: string | null;
  firstName: string | null;
  records: ImpactRecord[];
  sentAt: string | null;
  canSend: boolean;
  blockedReason: string | null;
};

async function thankYouSentAtByDonor(
  db: Database,
  importId: string
): Promise<Map<string, string>> {
  const rows = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.action, "donations.thank_you_sent"))
    .orderBy(desc(auditLog.createdAt));

  const sentAt = new Map<string, string>();
  for (const row of rows) {
    if (!row.entityId || sentAt.has(row.entityId)) continue;
    if (!row.detail) continue;
    try {
      const detail = JSON.parse(row.detail) as { importId?: string };
      if (detail.importId !== importId) continue;
      sentAt.set(row.entityId, row.createdAt.toISOString());
    } catch {
      continue;
    }
  }
  return sentAt;
}

export async function listThankYouRecipients(
  db: Database,
  importId: string
): Promise<ThankYouRecipientCandidate[]> {
  const ledger = await buildLedger(db, importId, {}, false);
  const records = buildImpactRecords(ledger);
  const donors = await db.select().from(donor);
  const donorById = new Map(donors.map((entry) => [entry.id, entry]));
  const sentAtByDonor = await thankYouSentAtByDonor(db, importId);

  const grouped = new Map<string, ImpactRecord[]>();
  const nameByDonorId = new Map<string, string>();

  for (const record of records) {
    if (!record.donorId) continue;
    const existing = grouped.get(record.donorId) ?? [];
    existing.push(record);
    grouped.set(record.donorId, existing);
    nameByDonorId.set(record.donorId, record.donorName);
  }

  const candidates: ThankYouRecipientCandidate[] = [...grouped.entries()]
    .map(([donorId, donorRecords]) => {
      const donorRecord = donorById.get(donorId);
      const email = donorRecord?.email?.trim() || null;
      const sentAt = sentAtByDonor.get(donorId) ?? null;
      let blockedReason: string | null = null;

      if (!email) {
        blockedReason = "No email address on file";
      } else if (sentAt) {
        blockedReason = "Thank-you email already sent for this import";
      }

      return {
        donorId,
        donorName: nameByDonorId.get(donorId) ?? "Supporter",
        email,
        firstName: donorRecord?.firstName ?? null,
        records: donorRecords,
        sentAt,
        canSend: !blockedReason,
        blockedReason,
      };
    })
    .sort((a, b) => a.donorName.localeCompare(b.donorName, "en-AU"));

  return candidates;
}

export async function getThankYouRecipient(
  db: Database,
  importId: string,
  donorId: string,
  options?: { requireSendable?: boolean }
): Promise<ThankYouRecipient | null> {
  const candidates = await listThankYouRecipients(db, importId);
  const match = candidates.find((candidate) => candidate.donorId === donorId);
  if (!match?.donorId || !match.email) return null;
  if (options?.requireSendable !== false && !match.canSend) return null;

  return {
    donorId: match.donorId,
    donorName: match.donorName,
    email: match.email,
    firstName: match.firstName,
    records: match.records,
    sentAt: match.sentAt,
  };
}

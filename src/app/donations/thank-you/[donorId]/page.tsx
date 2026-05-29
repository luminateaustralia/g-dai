import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DonorImpactDashboard } from "@/components/donations/donor-impact-dashboard";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { buildDonorImpactDashboardData } from "@/lib/close-the-loop/donor-impact-dashboard";
import { getLatestDonationImport } from "@/lib/close-the-loop/queries";
import { getThankYouRecipient } from "@/lib/close-the-loop/thank-you-recipients";

export const dynamic = "force-dynamic";

export default async function DonorImpactTrackerPage({
  params,
}: {
  params: Promise<{ donorId: string }>;
}) {
  const { donorId } = await params;
  const db = await getDb();
  const latest = await getLatestDonationImport(db);
  if (!latest) notFound();

  const recipient = await getThankYouRecipient(db, latest.id, donorId, {
    requireSendable: false,
  });
  if (!recipient) notFound();

  const dashboard = buildDonorImpactDashboardData({
    donorName: recipient.donorName,
    firstName: recipient.firstName,
    records: recipient.records,
  });

  return (
    <PageLayout breadcrumbLabel={recipient.donorName}>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations/thank-you">
            <ArrowLeft /> Back to Thank you
          </Link>
        }
      />

      <DonorImpactDashboard data={dashboard} />
    </PageLayout>
  );
}

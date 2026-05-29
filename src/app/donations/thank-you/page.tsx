import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  getLatestDonationImport,
} from "@/lib/close-the-loop/queries";
import { listThankYouRecipients } from "@/lib/close-the-loop/thank-you-recipients";
import { ThankYouTable } from "@/components/donations/thank-you-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ThankYouPage() {
  const db = await getDb();
  const user = await getCurrentUser();
  const canSend = roleHasPermission(user.role, "donations.resolve");

  const latest = await getLatestDonationImport(db);
  const recipients = latest
    ? await listThankYouRecipients(db, latest.id)
    : [];

  const readyCount = recipients.filter((recipient) => recipient.canSend).length;
  const sentCount = recipients.filter((recipient) => recipient.sentAt).length;

  return (
    <PageLayout>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={
          <Link href="/donations">
            <ArrowLeft /> Back to Impact
          </Link>
        }
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Thank-you emails
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Send personalised 1:1 thank-you emails to donors using the same
          partner-safe impact data as the export. Each email summarises confirmed
          and likely matches for that donor only.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Eligible donors" value={String(recipients.length)} />
        <Stat label="Ready to send" value={String(readyCount)} />
        <Stat label="Already sent" value={String(sentCount)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Donor recipients</CardTitle>
          <CardDescription>
            {latest
              ? `Latest import: ${latest.filename}. Configure RESEND_API_KEY and RESEND_FROM_EMAIL to send.`
              : "Import a workbook to see eligible donors."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canSend ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Your role can view this list but cannot send emails. Switch to an
              Operations or Administrator role to send.
            </p>
          ) : null}
          {recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No confirmed or likely donor matches are available yet.
            </p>
          ) : (
            <ThankYouTable recipients={recipients} canSend={canSend} />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

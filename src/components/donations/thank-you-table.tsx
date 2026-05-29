"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, Loader2, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import {
  previewThankYouEmailAction,
  sendThankYouEmailAction,
} from "@/app/donations/thank-you/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ThankYouRecipientCandidate } from "@/lib/close-the-loop/thank-you-recipients";

type ThankYouTableProps = {
  recipients: ThankYouRecipientCandidate[];
  canSend: boolean;
};

export function ThankYouTable({ recipients, canSend }: ThankYouTableProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewTo, setPreviewTo] = useState("");
  const [previewDonorName, setPreviewDonorName] = useState("");
  const [activeDonorId, setActiveDonorId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openPreview(donorId: string) {
    startTransition(async () => {
      try {
        const preview = await previewThankYouEmailAction(donorId);
        setPreviewHtml(preview.html);
        setPreviewSubject(preview.subject);
        setPreviewTo(preview.to);
        setPreviewDonorName(preview.donorName);
        setActiveDonorId(donorId);
        setPreviewOpen(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not load preview."
        );
      }
    });
  }

  function sendEmail(donorId: string) {
    startTransition(async () => {
      try {
        await sendThankYouEmailAction(donorId);
        toast.success("Thank-you email sent.");
        setPreviewOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not send email."
        );
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Impact rows</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient) => (
            <TableRow key={recipient.donorId ?? recipient.donorName}>
              <TableCell className="font-medium">
                {recipient.donorName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.email ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {recipient.records.length}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {recipient.sentAt
                  ? `Sent ${formatSentAt(recipient.sentAt)}`
                  : recipient.blockedReason ?? "Ready to send"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!recipient.donorId}
                    render={
                      recipient.donorId ? (
                        <Link href={`/donations/thank-you/${recipient.donorId}`}>
                          <TrendingUp />
                          Impact tracker
                        </Link>
                      ) : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      pending ||
                      !recipient.donorId ||
                      !recipient.email ||
                      !canSend
                    }
                    onClick={() =>
                      recipient.donorId && openPreview(recipient.donorId)
                    }
                  >
                    {pending && activeDonorId === recipient.donorId ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Eye />
                    )}
                    Preview
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !recipient.canSend || !canSend}
                    onClick={() =>
                      recipient.donorId && sendEmail(recipient.donorId)
                    }
                  >
                    {pending && activeDonorId === recipient.donorId ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Mail />
                    )}
                    Send
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100%-2rem))] flex-col sm:max-w-[min(960px,calc(100%-2rem))]">
          <DialogHeader>
            <DialogTitle>Preview thank-you email</DialogTitle>
            <DialogDescription>
              {previewDonorName} &middot; {previewTo}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/20">
            <iframe
              title={`Thank-you email preview for ${previewDonorName}`}
              srcDoc={previewHtml}
              className="h-[min(60vh,640px)] w-full bg-white"
              sandbox=""
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Subject: {previewSubject}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={pending || !activeDonorId || !canSend}
              onClick={() => activeDonorId && sendEmail(activeDonorId)}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Mail />}
              Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatSentAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

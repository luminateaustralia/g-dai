"use client";

import { useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendImpactReportAction } from "@/app/donations-beta/actions";

export function SendImpactReportButton({
  recipientKey,
  disabled,
}: {
  recipientKey: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await sendImpactReportAction(recipientKey);
            toast.success("Impact report email sent.");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not send email."
            );
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Mail />}
      Email report
    </Button>
  );
}

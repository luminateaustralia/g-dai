"use client";

import { useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { runMatchingAction } from "@/app/donations/actions";

export function RunMatchingButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending || disabled}
      onClick={() =>
        startTransition(async () => {
          try {
            await runMatchingAction();
            toast.success("Matching re-run complete.");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not run matching."
            );
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
      Re-run matching
    </Button>
  );
}

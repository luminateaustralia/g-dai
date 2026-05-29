"use client";

import { useTransition } from "react";
import { Check, HelpCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resolveTraceAction } from "@/app/donations/actions";

export function TraceResolveControls({
  traceId,
  canResolve,
}: {
  traceId: string;
  canResolve: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!canResolve) {
    return (
      <p className="text-xs text-muted-foreground">
        Your role cannot resolve traces.
      </p>
    );
  }

  function update(status: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("traceId", traceId);
      formData.set("status", status);
      try {
        await resolveTraceAction(formData);
        toast.success("Trace updated.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update trace."
        );
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : null}
      <Button
        size="xs"
        variant="outline"
        disabled={pending}
        onClick={() => update("matched")}
      >
        <Check /> Confirm
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={pending}
        onClick={() => update("needs_review")}
      >
        <HelpCircle /> Needs review
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={pending}
        onClick={() => update("unmatched")}
      >
        <X /> Unmatched
      </Button>
    </div>
  );
}

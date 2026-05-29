"use client";

import { useTransition } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  loadDemoScenarioAction,
  runAllocationAction,
} from "@/app/donations-beta/actions";

export function RunAllocationButton({
  disabled,
  importId,
}: {
  disabled?: boolean;
  importId?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await runAllocationAction(importId);
            toast.success("Allocation run completed.");
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Allocation failed."
            );
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Play />}
      Run allocation
    </Button>
  );
}

export function LoadDemoScenarioButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await loadDemoScenarioAction();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Could not load demo."
            );
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Load demo scenario
    </Button>
  );
}

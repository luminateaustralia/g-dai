"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteImportAction } from "@/app/import/actions";
import type { ImportPurgeType } from "@/lib/import-purge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteImportButton({
  type,
  importId,
  filename,
  disabled,
  disabledReason,
}: {
  type: ImportPurgeType;
  importId: string;
  filename: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const typeLabel =
    type === "wellbeing" ? "wellbeing" : "donation impact";
  const confirmed = confirmText === filename;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmText("");
      setError(null);
    }
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteImportAction(type, importId);
      if (result.error) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  if (disabled) {
    return (
      <Button
        variant="destructive"
        size="sm"
        disabled
        title={disabledReason}
      >
        <Trash2 />
        Delete
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 />
            Delete
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete import</DialogTitle>
          <DialogDescription>
            This permanently removes the {typeLabel} import{" "}
            <span className="font-medium text-foreground">{filename}</span>{" "}
            and all data derived from it
            {type === "wellbeing"
              ? ", including generated reports and orphaned cohorts."
              : ", including matching traces and orphaned donors."}{" "}
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`confirm-delete-${importId}`}>
            Type the filename to confirm
          </Label>
          <Input
            id={`confirm-delete-${importId}`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={filename}
            autoComplete="off"
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmed || pending}
            onClick={handleDelete}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {pending ? "Deleting…" : "Delete import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState } from "react";
import { Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type UploadState = { error?: string };

type UploadAction = (
  state: UploadState,
  formData: FormData
) => Promise<UploadState>;

export function UploadForm({
  action,
  disabled,
  disabledReason,
  accept = ".xlsx,.xls",
  buttonLabel = "Import workbook",
}: {
  action: UploadAction;
  disabled?: boolean;
  disabledReason?: string;
  accept?: string;
  buttonLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    action,
    {}
  );

  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground">
        {disabledReason ?? "You do not have permission to import data."}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="file"
        name="file"
        accept={accept}
        required
        className="cursor-pointer"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Upload />}
          {pending ? "Importing…" : buttonLabel}
        </Button>
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}

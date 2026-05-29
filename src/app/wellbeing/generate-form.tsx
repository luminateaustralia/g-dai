"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateImpactReportAction, type GenerateState } from "./actions";

export function GenerateForm({
  importId,
  canGenerate,
  defaultTitle,
  defaultPeriod,
}: {
  importId: string;
  canGenerate: boolean;
  defaultTitle: string;
  defaultPeriod: string;
}) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateImpactReportAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="importId" value={importId} />

      <div className="grid gap-2">
        <Label htmlFor="title">Report title</Label>
        <Input id="title" name="title" defaultValue={defaultTitle} required />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-1">
          <Label htmlFor="periodLabel">Reporting period</Label>
          <Input
            id="periodLabel"
            name="periodLabel"
            placeholder="e.g. Q2 FY26"
            defaultValue={defaultPeriod}
          />
        </div>
        <div className="grid gap-2 sm:col-span-1">
          <Label htmlFor="periodStart">Period start</Label>
          <Input id="periodStart" name="periodStart" type="date" />
        </div>
        <div className="grid gap-2 sm:col-span-1">
          <Label htmlFor="periodEnd">Period end</Label>
          <Input id="periodEnd" name="periodEnd" type="date" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="methodologyNotes">Methodology notes</Label>
        <textarea
          id="methodologyNotes"
          name="methodologyNotes"
          rows={3}
          defaultValue="Averages exclude blank responses and 'Don't know' answers. Change scores compare the baseline average to the 3-month and 6-month averages."
          className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="deidentified"
          defaultChecked
          value="on"
          className="size-4 rounded border-input"
        />
        Produce a de-identified report (hide client names)
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !canGenerate}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {pending ? "Generating…" : "Generate report"}
        </Button>
        {!canGenerate ? (
          <span className="text-sm text-muted-foreground">
            Your role cannot generate reports.
          </span>
        ) : null}
        {state.error ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}

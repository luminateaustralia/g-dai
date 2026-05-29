import { AlertTriangle, CircleAlert, Info, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  IssueLevel,
  ValidationIssue,
} from "@/lib/impact-reporting/validation/validate";

const LEVEL_STYLES: Record<
  IssueLevel,
  { icon: typeof Info; className: string; label: string }
> = {
  error: {
    icon: CircleAlert,
    className: "text-destructive",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-amber-600 dark:text-amber-500",
    label: "Warning",
  },
  info: {
    icon: Info,
    className: "text-muted-foreground",
    label: "Note",
  },
};

export function ValidationIssues({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
        <CheckCircle2 className="size-4" />
        No data quality issues detected.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue, index) => {
        const style = LEVEL_STYLES[issue.level];
        const Icon = style.icon;
        return (
          <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
            <Icon className={cn("mt-0.5 size-4 shrink-0", style.className)} />
            <span className="text-sm">
              <span className="sr-only">{style.label}: </span>
              {issue.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

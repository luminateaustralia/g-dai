import { cn } from "@/lib/utils";
import {
  formatChange,
  formatScore,
  type MetricRow,
} from "@/lib/impact-reporting/presentation";
import { CATEGORY_LABELS } from "@/lib/impact-reporting/metrics/definitions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function changeClass(value: number | null) {
  if (value === null || value === 0) return "text-muted-foreground";
  return value > 0
    ? "text-emerald-600 dark:text-emerald-500"
    : "text-destructive";
}

export function MetricsTable({ rows }: { rows: MetricRow[] }) {
  const categories = Array.from(new Set(rows.map((r) => r.category)));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          <TableHead className="text-right">Baseline</TableHead>
          <TableHead className="text-right">3 months</TableHead>
          <TableHead className="text-right">6 months</TableHead>
          <TableHead className="text-right">Change (B→3m)</TableHead>
          <TableHead className="text-right">Change (B→6m)</TableHead>
          <TableHead className="text-right">n</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            rows={rows.filter((r) => r.category === category)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function CategorySection({
  category,
  rows,
}: {
  category: string;
  rows: MetricRow[];
}) {
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell
          colSpan={7}
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ??
            category}
        </TableCell>
      </TableRow>
      {rows.map((row) => (
        <TableRow key={row.key}>
          <TableCell className="font-medium">
            {row.label}
            <span className="ml-1 text-xs text-muted-foreground">
              /{row.scaleMax}
            </span>
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatScore(row.baseline)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatScore(row.threeMo)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatScore(row.sixMo)}
          </TableCell>
          <TableCell
            className={cn(
              "text-right font-medium tabular-nums",
              changeClass(row.change3)
            )}
          >
            {formatChange(row.change3)}
          </TableCell>
          <TableCell
            className={cn(
              "text-right font-medium tabular-nums",
              changeClass(row.change6)
            )}
          >
            {formatChange(row.change6)}
          </TableCell>
          <TableCell className="text-right tabular-nums text-muted-foreground">
            {row.nBaseline}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

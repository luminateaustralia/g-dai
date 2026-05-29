"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const movementConfig = {
  baseline: { label: "Baseline", color: "var(--chart-3)" },
  threeMo: { label: "3 months", color: "var(--chart-2)" },
  sixMo: { label: "6 months", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type MovementDatum = {
  label: string;
  baseline: number | null;
  threeMo: number | null;
  sixMo: number | null;
};

export function DomainMovementChart({ data }: { data: MovementDatum[] }) {
  return (
    <ChartContainer config={movementConfig} className="h-80 w-full">
      <BarChart data={data} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-32}
          textAnchor="end"
          height={88}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="baseline" fill="var(--color-baseline)" radius={3} />
        <Bar dataKey="threeMo" fill="var(--color-threeMo)" radius={3} />
        <Bar dataKey="sixMo" fill="var(--color-sixMo)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}

export type ChangeDatum = { label: string; change: number };

export function ChangeChart({ data }: { data: ChangeDatum[] }) {
  const config = {
    change: { label: "Change (Baseline → 6 months)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-80 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="change" radius={3}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.change >= 0 ? "var(--chart-2)" : "var(--destructive)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const cohortConfig = {
  baseline: { label: "Baseline", color: "var(--chart-3)" },
  sixMo: { label: "6 months", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type CohortDatum = {
  cohort: string;
  baseline: number | null;
  sixMo: number | null;
};

export function CohortComparisonChart({ data }: { data: CohortDatum[] }) {
  return (
    <ChartContainer config={cohortConfig} className="h-72 w-full">
      <BarChart data={data} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="cohort"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="baseline" fill="var(--color-baseline)" radius={3} />
        <Bar dataKey="sixMo" fill="var(--color-sixMo)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}

export type CompletionDatum = { label: string; completion: number };

export function CompletionChart({ data }: { data: CompletionDatum[] }) {
  const config = {
    completion: { label: "Completion %", color: "var(--chart-2)" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={data} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-32}
          textAnchor="end"
          height={88}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} width={32} domain={[0, 100]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="completion" fill="var(--color-completion)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}

const journeyConfig = {
  pwi: { label: "Personal Wellbeing Index", color: "var(--chart-1)" },
  wellbeing: { label: "Wellbeing & confidence", color: "var(--chart-2)" },
  work: { label: "Work readiness", color: "var(--chart-3)" },
} satisfies ChartConfig;

export type JourneyDatum = {
  stage: string;
  pwi: number | null;
  wellbeing: number | null;
  work: number | null;
};

/**
 * Tracks each measurement category as a percentage of its scale maximum so the
 * differently-scaled measures (0–10, 1–5, 1–4) can be compared on one axis as
 * clients move through the programme.
 */
export function WellbeingJourneyChart({ data }: { data: JourneyDatum[] }) {
  return (
    <ChartContainer config={journeyConfig} className="h-80 w-full">
      <LineChart data={data} margin={{ left: -8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(0)}%`} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="pwi"
          type="monotone"
          stroke="var(--color-pwi)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          dataKey="wellbeing"
          type="monotone"
          stroke="var(--color-wellbeing)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          dataKey="work"
          type="monotone"
          stroke="var(--color-work)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}

const periodTrendConfig = {
  baseline: { label: "Baseline", color: "var(--chart-3)" },
  sixMo: { label: "6 months", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type PeriodTrendDatum = {
  label: string;
  baseline: number | null;
  sixMo: number | null;
};

/**
 * Personal Wellbeing Index intake (baseline) versus outcome (6 months) across
 * successive reporting periods, ordered oldest to newest.
 */
export function PeriodTrendChart({ data }: { data: PeriodTrendDatum[] }) {
  return (
    <ChartContainer config={periodTrendConfig} className="h-80 w-full">
      <LineChart data={data} margin={{ left: -8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-32}
          textAnchor="end"
          height={88}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} width={32} domain={[0, 10]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="baseline"
          type="monotone"
          stroke="var(--color-baseline)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          dataKey="sixMo"
          type="monotone"
          stroke="var(--color-sixMo)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}

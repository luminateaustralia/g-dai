"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Label,
  Pie,
  PieChart,
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

export type DonationTypeDatum = {
  key: string;
  label: string;
  donations: number;
  quantity: number;
};

export type TopShelterDatum = {
  shelter: string;
  donations: number;
  quantity: number;
};

const TYPE_COLORS = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-4)",
];

export function DonationTypeChart({
  data,
  totalQuantity,
}: {
  data: DonationTypeDatum[];
  totalQuantity: number;
}) {
  const chartData = React.useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        fill: TYPE_COLORS[i % TYPE_COLORS.length],
      })),
    [data]
  );

  const config = React.useMemo<ChartConfig>(() => {
    const entries: ChartConfig = {
      quantity: { label: "Items delivered" },
    };
    data.forEach((d, i) => {
      entries[d.key] = {
        label: d.label,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
      };
    });
    return entries;
  }, [data]);

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square h-72 w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="label" hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="quantity"
          nameKey="label"
          innerRadius={68}
          outerRadius={104}
          strokeWidth={4}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground font-heading text-3xl font-semibold tabular-nums"
                    >
                      {totalQuantity.toLocaleString("en-AU")}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 24}
                      className="fill-muted-foreground text-xs"
                    >
                      items delivered
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="label" />}
          className="flex-wrap gap-2"
        />
      </PieChart>
    </ChartContainer>
  );
}

export function TopSheltersChart({ data }: { data: TopShelterDatum[] }) {
  const config = {
    donations: { label: "Donations", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="h-72 w-full"
      style={{ height: Math.max(data.length * 40, 160) }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 32 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="shelter"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="donations" fill="var(--color-donations)" radius={4}>
          <LabelList
            dataKey="donations"
            position="right"
            offset={8}
            className="fill-foreground tabular-nums"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Heart, UtensilsCrossed } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { DonorImpactDashboardData } from "@/lib/close-the-loop/donor-impact-dashboard";

const BRAND = {
  warm: "#C8522A",
  warmLight: "#F5C4B3",
  warmPale: "#FAECE7",
  green: "#1D9E75",
  greenLight: "#E1F5EE",
  amber: "#BA7517",
  amberLight: "#FAEEDA",
  gray: "#D3D1C7",
  grayMid: "#B4B2A9",
} as const;

const mealsChartConfig = {
  funded: { label: "Meals funded", color: BRAND.warm },
  demand: { label: "Monthly demand", color: BRAND.grayMid },
} satisfies ChartConfig;

const demandChartConfig = {
  demand: { label: "Demand", color: BRAND.grayMid },
  funded: { label: "Funded", color: BRAND.warm },
} satisfies ChartConfig;

type DonorImpactDashboardProps = {
  data: DonorImpactDashboardData;
};

export function DonorImpactDashboard({ data }: DonorImpactDashboardProps) {
  const [chartMode, setChartMode] = React.useState<"monthly" | "cumulative">(
    "monthly"
  );

  const monthlyChartData = React.useMemo(
    () =>
      data.monthlySeries.map((entry) => ({
        month: entry.label,
        funded: entry.funded,
        demand: 300,
      })),
    [data.monthlySeries]
  );

  const cumulativeChartData = React.useMemo(() => {
    let fundedTotal = 0;
    let demandTotal = 0;
    return data.monthlySeries.map((entry) => {
      fundedTotal += entry.funded;
      demandTotal += 300;
      return {
        month: entry.label,
        funded: fundedTotal,
        demand: demandTotal,
      };
    });
  }, [data.monthlySeries]);

  const chartData =
    chartMode === "monthly" ? monthlyChartData : cumulativeChartData;
  const stillNeeded = Math.max(0, data.currentMonth.goal - data.currentMonth.funded);
  const ringOffset =
    226 - Math.round((data.nextGoal.progressPercent / 100) * 226);

  return (
    <div className="mx-auto max-w-[680px] px-4 py-6 pb-8">
      <h2 className="sr-only">
        Two Good Co donor impact dashboard showing meals funded, demand gap, and
        giving trends
      </h2>

      <header className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-[#111] px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-white">
          TWO GOOD CO.
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Your impact dashboard</p>
          <p className="text-base font-medium text-foreground">
            Welcome back, {data.greetingName} 👋
          </p>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <MetricCard
          icon={<UtensilsCrossed className="size-5 text-[#C8522A]" aria-hidden />}
          label="Your meals funded"
          value={data.totalMeals.toLocaleString("en-AU")}
          sub={data.sinceLabel}
          valueClassName="text-[#C8522A]"
        />
        <MetricCard
          icon={<Heart className="size-5 text-[#1D9E75]" aria-hidden />}
          label="Partners reached"
          value={data.partnersReached.toLocaleString("en-AU")}
          sub="unique partners helped"
          valueClassName="text-[#1D9E75]"
        />
        <MetricCard
          icon={<Flame className="size-5 text-[#BA7517]" aria-hidden />}
          label="Giving streak"
          value={`${data.givingStreakMonths} mo`}
          sub={data.givingStreakMonths > 0 ? "keep it going!" : "start your streak"}
          valueClassName="text-[#BA7517]"
        />
      </div>

      <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-4 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          This month&apos;s bowl — {data.currentMonth.label}
        </h3>
        <div className="flex items-end gap-6">
          <BowlVisual fillPercent={data.currentMonth.fillPercent} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-muted-foreground">Meals funded so far</p>
            <p className="text-[28px] leading-none font-medium text-foreground">
              <span className="text-[#C8522A]">
                {data.currentMonth.funded.toLocaleString("en-AU")}
              </span>{" "}
              <span className="text-base text-muted-foreground">
                / {data.currentMonth.goal.toLocaleString("en-AU")} goal
              </span>
            </p>
            <div className="mt-4">
              <div className="h-[22px] overflow-hidden rounded-full bg-muted">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-[#C8522A] pr-2 text-[11px] font-medium text-white transition-all duration-1000"
                  style={{ width: `${data.currentMonth.fillPercent}%` }}
                >
                  {data.currentMonth.funded > 0
                    ? data.currentMonth.funded.toLocaleString("en-AU")
                    : null}
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#C8522A]" />
                  Funded ({data.currentMonth.funded.toLocaleString("en-AU")})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#D3D1C7]" />
                  Still needed ({stillNeeded.toLocaleString("en-AU")})
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {stillNeeded > 0
                ? `${stillNeeded.toLocaleString("en-AU")} more meals needed to cover full demand this month.`
                : "You have fully funded this month's bowl."}{" "}
              Every $7 fills one bowl. 🍲
            </p>
          </div>
        </div>
      </section>

      {data.monthlySeries.length > 0 ? (
        <>
          <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
            <h3 className="mb-3 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              Meals funded over time
            </h3>
            <div className="mb-3 flex gap-1.5">
              {(["monthly", "cumulative"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setChartMode(mode)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    chartMode === mode
                      ? "border-transparent bg-[#111] text-white"
                      : "border-border bg-transparent text-muted-foreground"
                  )}
                >
                  {mode === "monthly" ? "Monthly" : "Cumulative"}
                </button>
              ))}
            </div>
            <ChartContainer
              config={mealsChartConfig}
              className="aspect-auto h-[180px] w-full"
            >
              {chartMode === "monthly" ? (
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="funded" fill={BRAND.warm} radius={6} />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke={BRAND.grayMid}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                  />
                </ComposedChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="funded"
                    stroke={BRAND.warm}
                    strokeWidth={2}
                    dot={{ r: 4, fill: BRAND.warm }}
                  />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke={BRAND.grayMid}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                  />
                </LineChart>
              )}
            </ChartContainer>
          </section>

          <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
            <h3 className="mb-3 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              Monthly demand vs. supply
            </h3>
            <ChartContainer
              config={demandChartConfig}
              className="aspect-auto h-40 w-full"
            >
              <LineChart data={monthlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke={BRAND.grayMid}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3, fill: BRAND.grayMid }}
                />
                <Line
                  type="monotone"
                  dataKey="funded"
                  stroke={BRAND.warm}
                  strokeWidth={2}
                  dot={{ r: 3, fill: BRAND.warm }}
                  fill="rgba(200,82,42,0.1)"
                />
              </LineChart>
            </ChartContainer>
          </section>
        </>
      ) : null}

      <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Your giving history — last 12 months
        </h3>
        <div className="mb-1 flex flex-wrap gap-1.5">
          {data.streakMonths.map((month) => (
            <div
              key={`label-${month.label}`}
              className="w-[30px] text-center text-[9px] text-muted-foreground"
            >
              {month.label}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.streakMonths.map((month) => (
            <StreakBox key={month.label} label={month.label} meals={month.meals} />
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#C8522A]" />
            Active month
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#F5C4B3]" />
            Small gift
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#D3D1C7]" />
            No donation
          </span>
        </div>
      </section>

      {data.recentMoments.length > 0 ? (
        <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
          <h3 className="mb-3 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            Recent impact moments
          </h3>
          <div className="flex flex-col gap-2.5">
            {data.recentMoments.map((moment) => (
              <div
                key={moment.id}
                className="flex items-center gap-3 rounded-md bg-muted/70 p-2.5"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-medium",
                    moment.tone === "warm" && "bg-[#FAECE7] text-[#993C1D]",
                    moment.tone === "green" && "bg-[#E1F5EE] text-[#0F6E56]",
                    moment.tone === "amber" && "bg-[#FAEEDA] text-[#854F0B]"
                  )}
                >
                  {moment.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{moment.title}</p>
                  <p className="text-xs text-muted-foreground">{moment.action}</p>
                </div>
                {moment.badge ? (
                  <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-medium text-[#0F6E56]">
                    {moment.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-4 rounded-lg border border-border/60 bg-card p-5">
        <h3 className="mb-3 text-[13px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Your next goal
        </h3>
        <div className="flex items-center gap-6">
          <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
            <circle cx="45" cy="45" r="36" fill="none" stroke="#F1EFE8" strokeWidth="10" />
            <circle
              cx="45"
              cy="45"
              r="36"
              fill="none"
              stroke="#C8522A"
              strokeWidth="10"
              strokeDasharray="226"
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
            />
            <text
              x="45"
              y="41"
              textAnchor="middle"
              fontSize="14"
              fontWeight="500"
              fill="currentColor"
            >
              {data.nextGoal.current.toLocaleString("en-AU")}
            </text>
            <text
              x="45"
              y="55"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.6"
            >
              / {data.nextGoal.target.toLocaleString("en-AU")}
            </text>
          </svg>
          <div>
            <h4 className="text-[22px] font-medium text-foreground">{data.nextGoal.label}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Reach {data.nextGoal.target.toLocaleString("en-AU")} meals to unlock the{" "}
              <strong>
                {
                  data.nextGoal.milestones.find((milestone) => !milestone.achieved)?.name ??
                  data.nextGoal.milestones.at(-1)?.name
                }
              </strong>{" "}
              badge — you&apos;re {data.nextGoal.progressPercent}% there!
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {data.nextGoal.milestones.map((milestone) => (
                <div
                  key={milestone.name}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span className={milestone.achieved ? "text-[#1D9E75]" : "text-[#BA7517]"}>
                    {milestone.achieved ? "✓" : "🔒"}
                  </span>
                  <span>
                    {milestone.meals.toLocaleString("en-AU")} meals —{" "}
                    <em>{milestone.name}</em>
                    {milestone.achieved ? " ✓" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/70 p-4">
      <div className="mb-1.5">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-[22px] leading-tight font-medium", valueClassName)}>{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function BowlVisual({ fillPercent }: { fillPercent: number }) {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true" className="shrink-0">
      <defs>
        <clipPath id="bowlClip">
          <ellipse cx="55" cy="58" rx="42" ry="30" />
        </clipPath>
      </defs>
      <ellipse cx="55" cy="58" rx="42" ry="30" fill="#F1EFE8" />
      <rect
        x="13"
        y={44 + (30 * (100 - fillPercent)) / 100}
        width="84"
        height={30 * (fillPercent / 100)}
        fill="#C8522A"
        clipPath="url(#bowlClip)"
        opacity="0.85"
      />
      <ellipse cx="55" cy="44" rx="42" ry="12" fill="none" stroke="#C8522A" strokeWidth="2.5" />
      <ellipse cx="55" cy="44" rx="42" ry="12" fill="#FAECE7" />
      <text x="55" y="49" textAnchor="middle" fontSize="11" fontWeight="500" fill="#993C1D">
        {fillPercent}% filled
      </text>
      <path
        d="M30 70 Q55 80 80 70"
        fill="none"
        stroke="#993C1D"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  );
}

function StreakBox({ label, meals }: { label: string; meals: number }) {
  let background: string = BRAND.gray;
  let color: string = "#888888";

  if (meals > 0 && meals < 100) {
    background = BRAND.warmLight;
    color = "#993C1D";
  } else if (meals >= 100 && meals < 250) {
    background = "#F0997B";
    color = "#712B13";
  } else if (meals >= 250) {
    background = BRAND.warm;
    color = "#ffffff";
  }

  return (
    <div
      className="group relative flex size-[30px] items-center justify-center rounded-md text-[10px] font-medium"
      style={{ background, color }}
      title={meals > 0 ? `${label}: ${meals} meals` : `${label}: no donation`}
    >
      {meals > 0 ? meals : null}
    </div>
  );
}

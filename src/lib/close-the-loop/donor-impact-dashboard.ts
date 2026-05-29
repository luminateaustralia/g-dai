import type { ImpactRecord } from "@/lib/close-the-loop/impact-export";

const MONTHLY_DEMAND = 300;
const MILESTONES = [
  { meals: 500, name: "Nourisher" },
  { meals: 1000, name: "Champion" },
  { meals: 1500, name: "Sustainer" },
  { meals: 2500, name: "Changemaker" },
] as const;

export type DonorImpactMoment = {
  id: string;
  title: string;
  action: string;
  badge?: string;
  avatar: string;
  tone: "warm" | "green" | "amber";
};

export type DonorImpactDashboardData = {
  donorName: string;
  greetingName: string;
  totalMeals: number;
  partnersReached: number;
  givingStreakMonths: number;
  sinceLabel: string;
  currentMonth: {
    label: string;
    funded: number;
    goal: number;
    fillPercent: number;
  };
  monthlySeries: Array<{ label: string; monthKey: string; funded: number }>;
  streakMonths: Array<{ label: string; meals: number }>;
  recentMoments: DonorImpactMoment[];
  nextGoal: {
    current: number;
    target: number;
    label: string;
    progressPercent: number;
    milestones: Array<{ meals: number; name: string; achieved: boolean }>;
  };
};

function parseApproximatePeriod(period: string): Date | null {
  if (!period || period === "—") return null;
  const parsed = new Date(`1 ${period}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", { month: "short" }).format(date);
}

function longMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function mealQuantity(record: ImpactRecord): number {
  if (record.donationType !== "Meals") return 0;
  return record.quantity ?? 0;
}

function greetingName(firstName: string | null, donorName: string): string {
  const trimmedFirst = firstName?.trim();
  if (trimmedFirst) return trimmedFirst;
  const trimmedName = donorName.trim();
  if (trimmedName && trimmedName !== "Supporter") return trimmedName.split(" ")[0] ?? trimmedName;
  return "there";
}

export function buildDonorImpactDashboardData(input: {
  donorName: string;
  firstName: string | null;
  records: ImpactRecord[];
}): DonorImpactDashboardData {
  const recordsByMonth = new Map<string, { date: Date; meals: number; records: ImpactRecord[] }>();

  for (const record of input.records) {
    const parsed = parseApproximatePeriod(record.approximatePeriod);
    if (!parsed) continue;

    const key = monthKey(parsed);
    const existing = recordsByMonth.get(key) ?? {
      date: parsed,
      meals: 0,
      records: [],
    };
    existing.meals += mealQuantity(record);
    existing.records.push(record);
    recordsByMonth.set(key, existing);
  }

  const sortedMonths = [...recordsByMonth.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const totalMeals = input.records.reduce((sum, record) => sum + mealQuantity(record), 0);
  const partnersReached = new Set(
    input.records.map((record) => record.supported).filter(Boolean)
  ).size;

  const streakMonths = buildStreakMonths(recordsByMonth);
  const givingStreakMonths = countActiveStreak(streakMonths);

  const latestMonth = sortedMonths.at(-1);
  const sinceLabel = sortedMonths[0]
    ? `since ${longMonthLabel(sortedMonths[0].date)}`
    : "from your latest traceable gifts";

  const currentMonthDate = latestMonth?.date ?? new Date();
  const currentFunded = latestMonth?.meals ?? 0;
  const goal = Math.max(MONTHLY_DEMAND, currentFunded);
  const fillPercent = goal > 0 ? Math.min(100, Math.round((currentFunded / goal) * 100)) : 0;

  const monthlySeries = sortedMonths.map((entry) => ({
    label: shortMonthLabel(entry.date),
    monthKey: monthKey(entry.date),
    funded: entry.meals,
  }));

  const nextMilestone =
    MILESTONES.find((milestone) => totalMeals < milestone.meals) ??
    MILESTONES[MILESTONES.length - 1];
  const mealsToGoal = Math.max(0, nextMilestone.meals - totalMeals);
  const progressPercent =
    nextMilestone.meals > 0
      ? Math.min(100, Math.round((totalMeals / nextMilestone.meals) * 100))
      : 100;

  return {
    donorName: input.donorName,
    greetingName: greetingName(input.firstName, input.donorName),
    totalMeals,
    partnersReached,
    givingStreakMonths,
    sinceLabel,
    currentMonth: {
      label: longMonthLabel(currentMonthDate),
      funded: currentFunded,
      goal,
      fillPercent,
    },
    monthlySeries,
    streakMonths,
    recentMoments: buildRecentMoments(input.records),
    nextGoal: {
      current: totalMeals,
      target: nextMilestone.meals,
      label:
        mealsToGoal > 0
          ? `${mealsToGoal.toLocaleString("en-AU")} meals to your next badge`
          : "You unlocked every badge on this journey",
      progressPercent,
      milestones: MILESTONES.map((milestone) => ({
        meals: milestone.meals,
        name: milestone.name,
        achieved: totalMeals >= milestone.meals,
      })),
    },
  };
}

function buildStreakMonths(
  recordsByMonth: Map<string, { date: Date; meals: number; records: ImpactRecord[] }>
): Array<{ label: string; meals: number }> {
  const now = new Date();
  const months: Array<{ label: string; meals: number }> = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    months.push({
      label: shortMonthLabel(date),
      meals: recordsByMonth.get(key)?.meals ?? 0,
    });
  }

  return months;
}

function countActiveStreak(streakMonths: Array<{ label: string; meals: number }>): number {
  let streak = 0;
  for (let index = streakMonths.length - 1; index >= 0; index -= 1) {
    if (streakMonths[index]?.meals > 0) {
      streak += 1;
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}

function buildRecentMoments(records: ImpactRecord[]): DonorImpactMoment[] {
  return [...records]
    .sort((a, b) => {
      const aDate = parseApproximatePeriod(a.approximatePeriod)?.getTime() ?? 0;
      const bDate = parseApproximatePeriod(b.approximatePeriod)?.getTime() ?? 0;
      return bDate - aDate;
    })
    .slice(0, 3)
    .map((record, index) => {
      const quantity = record.quantity ?? 0;
      const region = record.region ? ` in ${record.region}` : "";

      return {
        id: `${record.supported}-${record.approximatePeriod}-${index}`,
        title:
          record.donationType === "Meals"
            ? `You funded ${quantity.toLocaleString("en-AU")} meals`
            : `You donated ${quantity.toLocaleString("en-AU")} care packs`,
        action: `→ Supported ${record.supported}${region}`,
        badge: record.matchConfidence === "Confirmed" ? "✓ Confirmed" : "Likely match",
        avatar: record.supported.charAt(0).toUpperCase() || "Y",
        tone: index === 0 ? "warm" : index === 1 ? "green" : "amber",
      };
    });
}

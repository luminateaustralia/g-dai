export type WeekBounds = {
  weekId: string;
  weekStart: string;
  weekEnd: string;
};

/**
 * Returns ISO week metadata (Monday–Sunday) for an ISO date string.
 */
export function weekBoundsFromIsoDate(isoDate: string): WeekBounds | null {
  const parsed = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;

  const date = new Date(parsed);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(parsed);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  return {
    weekId: formatIsoWeekId(monday),
    weekStart,
    weekEnd,
  };
}

function formatIsoWeekId(monday: Date): string {
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);

  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const weekNumber =
    1 +
    Math.floor(
      (thursday.getTime() - yearStart.getTime()) / (7 * 86_400_000)
    );

  return `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function formatWeekLabel(weekId: string): string {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekId;
  return `Week ${Number(match[2])}, ${match[1]}`;
}

export function compareWeekIds(a: string, b: string): number {
  return a.localeCompare(b);
}

export type StreakPeriod = "daily" | "weekly" | "monthly";

export interface StreakState {
  count: number;
  bestCount: number;
  lastPeriodKey: string | null;
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCDate(result.getUTCDate() + offset);
  return result;
}

export function periodKey(date: Date, period: StreakPeriod): string {
  if (period === "daily") {
    return date.toISOString().slice(0, 10);
  }
  if (period === "monthly") {
    return date.toISOString().slice(0, 7);
  }
  return startOfUtcWeek(date).toISOString().slice(0, 10);
}

function previousPeriodKey(date: Date, period: StreakPeriod): string {
  const previous = new Date(date);
  if (period === "daily") {
    previous.setUTCDate(previous.getUTCDate() - 1);
  } else if (period === "weekly") {
    previous.setUTCDate(previous.getUTCDate() - 7);
  } else {
    previous.setUTCMonth(previous.getUTCMonth() - 1);
  }
  return periodKey(previous, period);
}

export function advanceStreak(
  state: StreakState,
  date: Date,
  period: StreakPeriod,
): StreakState {
  const currentKey = periodKey(date, period);
  if (state.lastPeriodKey === currentKey) {
    return state;
  }

  const count =
    state.lastPeriodKey === previousPeriodKey(date, period)
      ? state.count + 1
      : 1;

  return {
    count,
    bestCount: Math.max(state.bestCount, count),
    lastPeriodKey: currentKey,
  };
}

export function dailyStreakBonus(count: number): number {
  if (count > 0 && count % 30 === 0) return 100;
  if (count > 0 && count % 14 === 0) return 50;
  if (count > 0 && count % 7 === 0) return 25;
  if (count > 0 && count % 3 === 0) return 10;
  return 0;
}

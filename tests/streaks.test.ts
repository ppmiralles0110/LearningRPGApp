import { describe, expect, it } from "vitest";
import {
  advanceStreak,
  dailyStreakBonus,
  periodKey,
} from "@/lib/domain/streaks";

describe("streaks", () => {
  it("does not advance twice in the same UTC period", () => {
    const date = new Date("2026-09-15T03:00:00.000Z");
    const once = advanceStreak(
      { count: 0, bestCount: 0, lastPeriodKey: null },
      date,
      "daily",
    );
    expect(advanceStreak(once, date, "daily")).toEqual(once);
  });

  it("increments only consecutive periods and resets gaps", () => {
    const first = advanceStreak(
      { count: 0, bestCount: 0, lastPeriodKey: null },
      new Date("2026-09-14T10:00:00.000Z"),
      "daily",
    );
    const second = advanceStreak(
      first,
      new Date("2026-09-15T10:00:00.000Z"),
      "daily",
    );
    const reset = advanceStreak(
      second,
      new Date("2026-09-18T10:00:00.000Z"),
      "daily",
    );
    expect(second.count).toBe(2);
    expect(reset).toMatchObject({ count: 1, bestCount: 2 });
  });

  it("uses stable weekly and monthly keys", () => {
    expect(periodKey(new Date("2026-09-20T23:59:00.000Z"), "weekly")).toBe(
      "2026-09-14",
    );
    expect(periodKey(new Date("2026-09-01T00:00:00.000Z"), "monthly")).toBe(
      "2026-09",
    );
  });

  it("awards milestone bonuses without per-day farming", () => {
    expect(dailyStreakBonus(2)).toBe(0);
    expect(dailyStreakBonus(3)).toBe(10);
    expect(dailyStreakBonus(7)).toBe(25);
    expect(dailyStreakBonus(14)).toBe(50);
    expect(dailyStreakBonus(30)).toBe(100);
  });
});

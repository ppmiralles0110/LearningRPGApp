import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  tierForLevel,
  xpRequiredForLevel,
} from "@/lib/domain/progression";

describe("progression", () => {
  it("calculates level boundaries deterministically", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(2)).toBe(250);
    expect(xpRequiredForLevel(3)).toBe(550);
    expect(calculateLevel(249).level).toBe(1);
    expect(calculateLevel(250)).toMatchObject({
      level: 2,
      tier: "Novice",
      xpIntoLevel: 0,
    });
  });

  it("caps progression at level 100", () => {
    const result = calculateLevel(Number.MAX_SAFE_INTEGER);
    expect(result.level).toBe(100);
    expect(result.tier).toBe("Legend");
    expect(result.progressPercent).toBe(100);
  });

  it("maps every named tier boundary", () => {
    expect(tierForLevel(1)).toBe("Novice");
    expect(tierForLevel(10)).toBe("Explorer");
    expect(tierForLevel(25)).toBe("Practitioner");
    expect(tierForLevel(40)).toBe("Specialist");
    expect(tierForLevel(55)).toBe("Architect");
    expect(tierForLevel(70)).toBe("Master Architect");
    expect(tierForLevel(85)).toBe("Legend");
  });

  it("rejects levels outside the supported range", () => {
    expect(() => xpRequiredForLevel(0)).toThrow(RangeError);
    expect(() => xpRequiredForLevel(101)).toThrow(RangeError);
  });
});

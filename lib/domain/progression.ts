export interface LevelProgress {
  level: number;
  tier: string;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  progressPercent: number;
}

const TIERS = [
  { min: 1, max: 9, name: "Novice" },
  { min: 10, max: 24, name: "Explorer" },
  { min: 25, max: 39, name: "Practitioner" },
  { min: 40, max: 54, name: "Specialist" },
  { min: 55, max: 69, name: "Architect" },
  { min: 70, max: 84, name: "Master Architect" },
  { min: 85, max: 100, name: "Legend" },
] as const;

export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 100) {
    throw new RangeError("Level must be an integer from 1 to 100.");
  }

  if (level === 1) {
    return 0;
  }

  const completedLevels = level - 1;
  return (completedLevels * (500 + (completedLevels - 1) * 50)) / 2;
}

export function tierForLevel(level: number): string {
  return TIERS.find((tier) => level >= tier.min && level <= tier.max)?.name ??
    "Legend";
}

export function calculateLevel(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;

  while (level < 100 && safeXp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }

  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp =
    level === 100 ? currentLevelXp : xpRequiredForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelXp;
  const span = Math.max(1, nextLevelXp - currentLevelXp);

  return {
    level,
    tier: tierForLevel(level),
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    progressPercent:
      level === 100 ? 100 : Math.min(100, Math.round((xpIntoLevel / span) * 100)),
  };
}

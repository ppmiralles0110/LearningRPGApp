import { describe, expect, it } from "vitest";
import { rankRecommendations } from "@/lib/domain/recommendations";
import type {
  LearnerSignal,
  RecommendationCandidate,
} from "@/lib/domain/types";

const signals: LearnerSignal[] = [
  {
    domain: "github-fundamentals",
    focusRank: 2,
    mastery: 60,
    confidence: 70,
    accuracy: 80,
  },
  {
    domain: "github-actions",
    focusRank: 1,
    mastery: 25,
    confidence: 30,
    accuracy: 50,
  },
];

const candidates: RecommendationCandidate[] = [
  {
    id: "actions",
    domain: "github-actions",
    difficulty: 2,
    durationMinutes: 45,
    prerequisites: ["github-fundamentals"],
    priority: 8,
  },
  {
    id: "too-long",
    domain: "github-fundamentals",
    difficulty: 4,
    durationMinutes: 120,
    prerequisites: [],
    priority: 10,
  },
  {
    id: "locked",
    domain: "ai-security",
    difficulty: 3,
    durationMinutes: 45,
    prerequisites: ["ai-engineering"],
    priority: 10,
  },
];

describe("adaptive recommendations", () => {
  it("prioritizes focus, weakness, accuracy, and time fit", () => {
    const ranked = rankRecommendations(candidates, signals, 45);
    expect(ranked.map((item) => item.id)).toEqual(["actions", "too-long"]);
    expect(ranked[0].reasons).toContain("Matches a selected focus area");
    expect(ranked[0].reasons).toContain("Builds a current skill gap");
    expect(ranked[0].reasons).toContain("Remediates recent quiz performance");
  });

  it("filters candidates whose prerequisites are not demonstrated", () => {
    const ranked = rankRecommendations(candidates, signals, 45);
    expect(ranked.some((item) => item.id === "locked")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { readinessScore, scoreExam } from "@/lib/domain/exams";
import type { ExamQuestionDefinition } from "@/lib/domain/types";

const questions: ExamQuestionDefinition[] = [
  {
    id: "q1",
    certificationCode: "TEST",
    type: "multiple_choice",
    difficulty: 1,
    domain: "github-actions",
    prompt: "Question 1",
    options: ["A", "B"],
    answer: 0,
    explanation: "A is correct.",
  },
  {
    id: "q2",
    certificationCode: "TEST",
    type: "scenario",
    difficulty: 2,
    domain: "ai-security",
    prompt: "Question 2",
    options: ["A", "B"],
    answer: 1,
    explanation: "B is correct.",
  },
];

describe("exam scoring and readiness", () => {
  it("scores attempts and reports weak topics", () => {
    const result = scoreExam(questions, { q1: 0, q2: 0 });
    expect(result).toMatchObject({
      score: 50,
      correct: 1,
      total: 2,
      passed: false,
      weakTopics: ["ai-security"],
    });
  });

  it("weights mastery, practice evidence, and confidence", () => {
    expect(
      readinessScore({
        mastery: [80, 70],
        examScores: [90, 80],
        confidence: 75,
      }),
    ).toBe(79);
    expect(
      readinessScore({ mastery: [30], examScores: [], confidence: 20 }),
    ).toBe(22);
  });
});

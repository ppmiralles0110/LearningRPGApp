import { describe, expect, it } from "vitest";
import { readinessScore, scoreExam } from "@/lib/domain/exams";
import {
  ASSESSMENT_QUESTION_COUNT,
  examQuestions,
  QUESTIONS_PER_CERTIFICATION,
} from "@/lib/domain/question-bank";
import type { ExamQuestionDefinition } from "@/lib/domain/types";
import {
  assembleExamQuestions,
  EXAM_DIFFICULTY_BLUEPRINTS,
} from "@/lib/services/exams";

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

  it("authors a 100-question bank for every certification with varied answers", () => {
    const certificationCodes = new Set(
      examQuestions.map((question) => question.certificationCode),
    );
    expect(certificationCodes.size).toBe(10);
    for (const certificationCode of certificationCodes) {
      const bank = examQuestions.filter(
        (question) => question.certificationCode === certificationCode,
      );
      expect(bank).toHaveLength(QUESTIONS_PER_CERTIFICATION);
      expect(new Set(bank.map((question) => question.id)).size).toBe(
        QUESTIONS_PER_CERTIFICATION,
      );
      expect(new Set(bank.map((question) => question.answer)).size).toBe(4);
      expect(new Set(bank.map((question) => question.prompt)).size).toBe(
        QUESTIONS_PER_CERTIFICATION,
      );
    }
  });

  it("assembles exact balanced assessments and rotates unseen questions", () => {
    const candidates = examQuestions
      .filter(
        (question) => question.certificationCode === "GH-FOUNDATIONS",
      )
      .map((question) => ({
        id: question.id,
        difficulty: question.difficulty,
      }));
    const first = assembleExamQuestions({
      candidates,
      difficulty: 3,
      seed: "first-attempt",
    });
    const second = assembleExamQuestions({
      candidates,
      difficulty: 3,
      previousQuestionIds: new Set(first.map((question) => question.id)),
      seed: "second-attempt",
    });

    expect(first).toHaveLength(ASSESSMENT_QUESTION_COUNT);
    expect(new Set(first.map((question) => question.id)).size).toBe(
      ASSESSMENT_QUESTION_COUNT,
    );
    expect(
      [1, 2, 3, 4, 5].map(
        (difficulty) =>
          first.filter((question) => question.difficulty === difficulty).length,
      ),
    ).toEqual(EXAM_DIFFICULTY_BLUEPRINTS[3]);
    expect(second.map((question) => question.id)).not.toEqual(
      first.map((question) => question.id),
    );
    expect(
      second.filter(
        (question) =>
          !first.some((previous) => previous.id === question.id),
      ),
    ).toHaveLength(28);
    expect(new Set(second.map((question) => question.id)).size).toBe(
      ASSESSMENT_QUESTION_COUNT,
    );
    const objectiveCounts = new Map<string, number>();
    for (const question of first) {
      const objective = question.id.replace(/-v\d+$/, "");
      objectiveCounts.set(objective, (objectiveCounts.get(objective) ?? 0) + 1);
    }
    expect(Math.max(...objectiveCounts.values())).toBeLessThanOrEqual(2);
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

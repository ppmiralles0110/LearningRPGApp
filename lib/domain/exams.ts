import type { ExamQuestionDefinition } from "@/lib/domain/types";

export interface ExamResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  topicScores: Array<{
    domain: string;
    correct: number;
    total: number;
    percent: number;
  }>;
  weakTopics: string[];
}

export function scoreExam(
  questions: ExamQuestionDefinition[],
  answers: Record<string, number>,
): ExamResult {
  if (questions.length === 0) {
    throw new Error("Cannot score an exam without questions.");
  }

  const topics = new Map<string, { correct: number; total: number }>();
  let correct = 0;

  for (const question of questions) {
    const isCorrect = answers[question.id] === question.answer;
    if (isCorrect) correct += 1;
    const current = topics.get(question.domain) ?? { correct: 0, total: 0 };
    topics.set(question.domain, {
      correct: current.correct + (isCorrect ? 1 : 0),
      total: current.total + 1,
    });
  }

  const topicScores = [...topics.entries()]
    .map(([domain, topic]) => ({
      domain,
      ...topic,
      percent: Math.round((topic.correct / topic.total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent || a.domain.localeCompare(b.domain));
  const score = Math.round((correct / questions.length) * 100);

  return {
    score,
    correct,
    total: questions.length,
    passed: score >= 70,
    topicScores,
    weakTopics: topicScores
      .filter((topic) => topic.percent < 70)
      .map((topic) => topic.domain),
  };
}

export function readinessScore(input: {
  mastery: number[];
  examScores: number[];
  confidence: number;
}): number {
  const average = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;
  const mastery = average(input.mastery);
  const exams = average(input.examScores);
  const hasExamEvidence = input.examScores.length > 0;

  return Math.round(
    Math.min(
      100,
      mastery * 0.5 +
        exams * (hasExamEvidence ? 0.35 : 0.15) +
        input.confidence * (hasExamEvidence ? 0.15 : 0.35),
    ),
  );
}

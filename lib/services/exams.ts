import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import { scoreExam, readinessScore, type ExamResult } from "@/lib/domain/exams";
import type {
  DomainSlug,
  ExamQuestionDefinition,
  ExamQuestionType,
} from "@/lib/domain/types";
import { AppError } from "@/lib/errors";

interface QuestionRow {
  id: string;
  certification_code: string;
  question_type: ExamQuestionType;
  difficulty: number;
  domain_slug: DomainSlug;
  case_context: string | null;
  prompt: string;
  options_json: string;
  answer_index: number;
  explanation: string;
}

interface AttemptRow {
  id: string;
  user_id: string;
  certification_code: string;
  difficulty: number;
  duration_minutes: number;
  status: "active" | "submitted" | "expired";
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  result_json: string | null;
}

export interface ExamQuestionView {
  id: string;
  type: ExamQuestionType;
  difficulty: number;
  domain: DomainSlug;
  caseContext: string | null;
  prompt: string;
  options: string[];
}

export interface ExamAttemptView {
  id: string;
  certificationCode: string;
  difficulty: number;
  durationMinutes: number;
  status: "active" | "submitted" | "expired";
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  result: ExamResult | null;
  questions: ExamQuestionView[];
  review:
    | Array<{
        questionId: string;
        selectedIndex: number;
        correctIndex: number;
        correct: boolean;
        explanation: string;
      }>
    | null;
}

function questionDefinition(row: QuestionRow): ExamQuestionDefinition {
  return {
    id: row.id,
    certificationCode: row.certification_code,
    type: row.question_type,
    difficulty: row.difficulty,
    domain: row.domain_slug,
    caseContext: row.case_context ?? undefined,
    prompt: row.prompt,
    options: JSON.parse(row.options_json) as string[],
    answer: row.answer_index,
    explanation: row.explanation,
  };
}

export function startExam(
  db: AppDatabase,
  input: {
    userId: string;
    certificationCode: string;
    difficulty: number;
    durationMinutes: number;
    now?: Date;
  },
): ExamAttemptView {
  const certification = db
    .prepare("SELECT code FROM certifications WHERE code = ?")
    .get(input.certificationCode) as { code: string } | undefined;
  if (!certification) {
    throw new AppError("Certification not found.", 404, "CERTIFICATION_NOT_FOUND");
  }

  const questions = db
    .prepare(`
      SELECT id
      FROM exam_questions
      WHERE certification_code = ? AND difficulty <= ?
      ORDER BY difficulty DESC, question_type DESC, id
      LIMIT 20
    `)
    .all(input.certificationCode, input.difficulty) as Array<{ id: string }>;
  if (questions.length === 0) {
    throw new AppError(
      "No practice questions are available for this configuration.",
      409,
      "NO_EXAM_QUESTIONS",
    );
  }

  const attemptId = randomUUID();
  const now = (input.now ?? new Date()).toISOString();
  const create = db.transaction(() => {
    db.prepare(`
      INSERT INTO exam_attempts(
        id, user_id, certification_code, difficulty, duration_minutes, status, started_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(
      attemptId,
      input.userId,
      input.certificationCode,
      input.difficulty,
      input.durationMinutes,
      now,
    );
    const insertQuestion = db.prepare(`
      INSERT INTO exam_attempt_questions(attempt_id, question_id, position)
      VALUES (?, ?, ?)
    `);
    questions.forEach((question, index) =>
      insertQuestion.run(attemptId, question.id, index),
    );
  });
  create();
  return getExamAttempt(db, input.userId, attemptId);
}

export function getExamAttempt(
  db: AppDatabase,
  userId: string,
  attemptId: string,
): ExamAttemptView {
  const row = db
    .prepare("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?")
    .get(attemptId, userId) as AttemptRow | undefined;
  if (!row) throw new AppError("Exam attempt not found.", 404, "EXAM_NOT_FOUND");

  const questions = db
    .prepare(`
      SELECT q.*
      FROM exam_attempt_questions aq
      JOIN exam_questions q ON q.id = aq.question_id
      WHERE aq.attempt_id = ?
      ORDER BY aq.position
    `)
    .all(attemptId) as QuestionRow[];
  const answers =
    row.status === "submitted"
      ? (db
          .prepare(`
            SELECT question_id, selected_index, correct
            FROM exam_answers
            WHERE attempt_id=?
          `)
          .all(attemptId) as Array<{
          question_id: string;
          selected_index: number;
          correct: number;
        }>)
      : [];
  const answerByQuestion = new Map(
    answers.map((answer) => [answer.question_id, answer]),
  );

  return {
    id: row.id,
    certificationCode: row.certification_code,
    difficulty: row.difficulty,
    durationMinutes: row.duration_minutes,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    score: row.score,
    result: row.result_json ? (JSON.parse(row.result_json) as ExamResult) : null,
    questions: questions.map((question) => {
      const definition = questionDefinition(question);
      return {
        id: definition.id,
        type: definition.type,
        difficulty: definition.difficulty,
        domain: definition.domain,
        caseContext: definition.caseContext ?? null,
        prompt: definition.prompt,
        options: definition.options,
      };
    }),
    review:
      row.status === "submitted"
        ? questions.map((question) => {
            const answer = answerByQuestion.get(question.id);
            return {
              questionId: question.id,
              selectedIndex: answer?.selected_index ?? -1,
              correctIndex: question.answer_index,
              correct: answer?.correct === 1,
              explanation: question.explanation,
            };
          })
        : null,
  };
}

function updateCertificationReadiness(
  db: AppDatabase,
  userId: string,
  certificationCode: string,
  now: string,
): number {
  const certification = db
    .prepare("SELECT domains_json FROM certifications WHERE code = ?")
    .get(certificationCode) as { domains_json: string };
  const domains = JSON.parse(certification.domains_json) as DomainSlug[];
  const placeholders = domains.map(() => "?").join(",");
  const skills = db
    .prepare(`
      SELECT mastery, confidence
      FROM skill_progress
      WHERE user_id = ? AND domain_slug IN (${placeholders})
    `)
    .all(userId, ...domains) as Array<{ mastery: number; confidence: number }>;
  const exams = db
    .prepare(`
      SELECT score
      FROM exam_attempts
      WHERE user_id = ? AND certification_code = ? AND status = 'submitted'
        AND score IS NOT NULL
      ORDER BY submitted_at DESC
      LIMIT 5
    `)
    .all(userId, certificationCode) as Array<{ score: number }>;
  const confidence =
    skills.length === 0
      ? 25
      : Math.round(
          skills.reduce((sum, skill) => sum + skill.confidence, 0) /
            skills.length,
        );
  const readiness = readinessScore({
    mastery: skills.map((skill) => skill.mastery),
    examScores: exams.map((exam) => exam.score),
    confidence,
  });
  const status = readiness >= 80 ? "ready" : readiness >= 35 ? "preparing" : "planned";
  db.prepare(`
    INSERT INTO user_certification_progress(
      user_id, certification_code, readiness, confidence, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, certification_code) DO UPDATE SET
      readiness=excluded.readiness,
      confidence=excluded.confidence,
      status=CASE
        WHEN user_certification_progress.status = 'certified' THEN 'certified'
        ELSE excluded.status
      END,
      updated_at=excluded.updated_at
  `).run(userId, certificationCode, readiness, confidence, status, now);
  return readiness;
}

export function submitExam(
  db: AppDatabase,
  input: {
    userId: string;
    attemptId: string;
    answers: Record<string, number>;
    now?: Date;
  },
): ExamAttemptView {
  const nowDate = input.now ?? new Date();
  const now = nowDate.toISOString();
  const submit = db.transaction(() => {
    const attempt = db
      .prepare("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?")
      .get(input.attemptId, input.userId) as AttemptRow | undefined;
    if (!attempt) {
      throw new AppError("Exam attempt not found.", 404, "EXAM_NOT_FOUND");
    }
    if (attempt.status !== "active") {
      throw new AppError(
        "This exam attempt has already ended.",
        409,
        "EXAM_ALREADY_ENDED",
      );
    }
    const expiresAt =
      new Date(attempt.started_at).getTime() + attempt.duration_minutes * 60_000;
    if (nowDate.getTime() > expiresAt) {
      db.prepare("UPDATE exam_attempts SET status = 'expired' WHERE id = ?").run(
        attempt.id,
      );
      return { expired: true };
    }

    const questionRows = db
      .prepare(`
        SELECT q.*
        FROM exam_attempt_questions aq
        JOIN exam_questions q ON q.id = aq.question_id
        WHERE aq.attempt_id = ?
        ORDER BY aq.position
      `)
      .all(attempt.id) as QuestionRow[];
    const expectedIds = new Set(questionRows.map((question) => question.id));
    const submittedIds = Object.keys(input.answers);
    if (
      submittedIds.length !== questionRows.length ||
      submittedIds.some((id) => !expectedIds.has(id))
    ) {
      throw new AppError(
        "Every question must have exactly one answer.",
        400,
        "INCOMPLETE_EXAM",
      );
    }

    const definitions = questionRows.map(questionDefinition);
    for (const question of definitions) {
      const answer = input.answers[question.id];
      if (answer < 0 || answer >= question.options.length) {
        throw new AppError(
          `Answer for question ${question.id} is invalid.`,
          400,
          "INVALID_EXAM_ANSWER",
        );
      }
    }
    const result = scoreExam(definitions, input.answers);
    const insertAnswer = db.prepare(`
      INSERT INTO exam_answers(attempt_id, question_id, selected_index, correct)
      VALUES (?, ?, ?, ?)
    `);
    const updateSkill = db.prepare(`
      INSERT INTO skill_progress(
        user_id, domain_slug, mastery, confidence, attempts,
        correct_answers, completed_steps, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, 0, ?)
      ON CONFLICT(user_id, domain_slug) DO UPDATE SET
        mastery=MIN(100, skill_progress.mastery + excluded.mastery),
        confidence=MIN(100, MAX(0, skill_progress.confidence + ?)),
        attempts=skill_progress.attempts + 1,
        correct_answers=skill_progress.correct_answers + excluded.correct_answers,
        updated_at=excluded.updated_at
    `);
    for (const question of definitions) {
      const correct = input.answers[question.id] === question.answer;
      insertAnswer.run(attempt.id, question.id, input.answers[question.id], correct ? 1 : 0);
      updateSkill.run(
        input.userId,
        question.domain,
        correct ? 4 : 1,
        correct ? 28 : 23,
        correct ? 1 : 0,
        now,
        correct ? 3 : -2,
      );
    }
    db.prepare(`
      UPDATE exam_attempts
      SET status='submitted', submitted_at=?, score=?, result_json=?
      WHERE id=?
    `).run(now, result.score, JSON.stringify(result), attempt.id);
    updateCertificationReadiness(
      db,
      input.userId,
      attempt.certification_code,
      now,
    );
    if (result.passed) {
      db.prepare(`
        INSERT OR IGNORE INTO user_achievements(
          user_id, achievement_code, unlocked_at
        ) VALUES (?, 'certification-warrior', ?)
      `).run(input.userId, now);
    }
    return { expired: false };
  });

  const result = submit();
  if (result.expired) {
    throw new AppError("The exam time limit has expired.", 409, "EXAM_EXPIRED");
  }
  return getExamAttempt(db, input.userId, input.attemptId);
}

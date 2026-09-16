import { createHash, randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/domain/question-bank";
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

interface QuestionCandidate {
  id: string;
  difficulty: number;
}

export const EXAM_DIFFICULTY_BLUEPRINTS: Record<
  number,
  readonly [number, number, number, number, number]
> = {
  1: [20, 18, 12, 6, 4],
  2: [16, 20, 14, 6, 4],
  3: [10, 16, 20, 10, 4],
  4: [6, 10, 16, 20, 8],
  5: [4, 6, 12, 18, 20],
};

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

function seededOrder<T extends { id: string }>(
  items: readonly T[],
  seed: string,
): T[] {
  return [...items].sort((left, right) => {
    const leftHash = createHash("sha256")
      .update(`${seed}:${left.id}`)
      .digest("hex");
    const rightHash = createHash("sha256")
      .update(`${seed}:${right.id}`)
      .digest("hex");
    return leftHash.localeCompare(rightHash);
  });
}

function questionObjectiveKey(questionId: string): string {
  return questionId.replace(/-v\d+$/, "");
}

export function assembleExamQuestions(input: {
  candidates: readonly QuestionCandidate[];
  difficulty: number;
  previousQuestionIds?: ReadonlySet<string>;
  seed: string;
}): QuestionCandidate[] {
  const blueprint = EXAM_DIFFICULTY_BLUEPRINTS[input.difficulty];
  if (!blueprint) {
    throw new AppError("Exam difficulty is invalid.", 400, "INVALID_DIFFICULTY");
  }

  const previous = input.previousQuestionIds ?? new Set<string>();
  const selected: QuestionCandidate[] = [];
  const selectedIds = new Set<string>();
  const objectiveCounts = new Map<string, number>();

  function selectFromPool(
    pool: readonly QuestionCandidate[],
    target: number,
  ): void {
    for (const allowedExistingCount of [0, 1]) {
      for (const question of pool) {
        if (selected.length >= target || selectedIds.has(question.id)) continue;
        const objectiveKey = questionObjectiveKey(question.id);
        if (
          (objectiveCounts.get(objectiveKey) ?? 0) !== allowedExistingCount
        ) {
          continue;
        }
        selected.push(question);
        selectedIds.add(question.id);
        objectiveCounts.set(objectiveKey, allowedExistingCount + 1);
      }
    }
  }

  for (let difficulty = 1; difficulty <= blueprint.length; difficulty += 1) {
    const target = blueprint[difficulty - 1];
    const candidates = input.candidates.filter(
      (question) => question.difficulty === difficulty,
    );
    const unseen = seededOrder(
      candidates.filter((question) => !previous.has(question.id)),
      `${input.seed}:difficulty:${difficulty}:unseen`,
    );
    const seen = seededOrder(
      candidates.filter((question) => previous.has(question.id)),
      `${input.seed}:difficulty:${difficulty}:seen`,
    );
    const selectionTarget = selected.length + target;
    selectFromPool(unseen, selectionTarget);
    selectFromPool(seen, selectionTarget);
  }

  if (selected.length < ASSESSMENT_QUESTION_COUNT) {
    const unseenRemaining = seededOrder(
      input.candidates.filter((question) => !selectedIds.has(question.id)),
      `${input.seed}:remainder:unseen`,
    ).filter((question) => !previous.has(question.id));
    const seenRemaining = seededOrder(
      input.candidates.filter((question) => !selectedIds.has(question.id)),
      `${input.seed}:remainder:seen`,
    ).filter((question) => previous.has(question.id));
    selectFromPool(
      unseenRemaining,
      ASSESSMENT_QUESTION_COUNT,
    );
    selectFromPool(
      seenRemaining,
      ASSESSMENT_QUESTION_COUNT,
    );
  }

  if (selected.length !== ASSESSMENT_QUESTION_COUNT) {
    throw new AppError(
      `This certification needs ${ASSESSMENT_QUESTION_COUNT} available questions before an assessment can start.`,
      409,
      "INSUFFICIENT_EXAM_QUESTIONS",
    );
  }

  return seededOrder(selected, `${input.seed}:final`);
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

  const candidates = db
    .prepare(`
      SELECT id, difficulty
      FROM exam_questions
      WHERE certification_code = ? AND active = 1
    `)
    .all(input.certificationCode) as QuestionCandidate[];
  if (candidates.length === 0) {
    throw new AppError(
      "No practice questions are available for this configuration.",
      409,
      "NO_EXAM_QUESTIONS",
    );
  }

  const attemptId = randomUUID();
  const previousQuestions = db
    .prepare(`
      SELECT aq.question_id AS id
      FROM exam_attempt_questions aq
      WHERE aq.attempt_id = (
        SELECT id
        FROM exam_attempts
        WHERE user_id = ? AND certification_code = ?
        ORDER BY started_at DESC, id DESC
        LIMIT 1
      )
    `)
    .all(input.userId, input.certificationCode) as Array<{ id: string }>;
  const questions = assembleExamQuestions({
    candidates,
    difficulty: input.difficulty,
    previousQuestionIds: new Set(
      previousQuestions.map((question) => question.id),
    ),
    seed: attemptId,
  });
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

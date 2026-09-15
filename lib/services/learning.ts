import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import type {
  DomainSlug,
  LearnerSignal,
  QuestCadence,
  QuestStep,
} from "@/lib/domain/types";
import { rankRecommendations } from "@/lib/domain/recommendations";
import {
  advanceStreak,
  dailyStreakBonus,
  periodKey,
  type StreakPeriod,
} from "@/lib/domain/streaks";
import { stableId } from "@/lib/auth/password";
import { AppError } from "@/lib/errors";

interface QuestJoinRow {
  id: string;
  template_id: string;
  cadence: QuestCadence;
  period_key: string;
  status: "active" | "completed";
  generated_at: string;
  completed_at: string | null;
  domain_slug: DomainSlug;
  title: string;
  summary: string;
  duration_minutes: number;
  difficulty: number;
  challenge_mode: "guided" | "semi-guided" | "expert";
  prerequisites_json: string;
  steps_json: string;
}

interface TemplateRow {
  id: string;
  domain_slug: DomainSlug;
  cadence: QuestCadence;
  duration_minutes: number;
  difficulty: number;
  prerequisites_json: string;
  priority: number;
}

interface CompletionRow {
  step_id: string;
  step_type: string;
  score: number | null;
  response_json: string | null;
  completed_at: string;
}

export interface QuestView {
  id: string;
  templateId: string;
  cadence: QuestCadence;
  periodKey: string;
  status: "active" | "completed";
  generatedAt: string;
  completedAt: string | null;
  domain: DomainSlug;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: number;
  challengeMode: "guided" | "semi-guided" | "expert";
  prerequisites: DomainSlug[];
  steps: Array<
    QuestStep & {
      completed: boolean;
      score: number | null;
      completedAt: string | null;
    }
  >;
  progressPercent: number;
}

function cadencePeriod(cadence: QuestCadence): StreakPeriod {
  if (cadence === "weekly") return "weekly";
  if (cadence === "monthly") return "monthly";
  return "daily";
}

export function getLearnerSignals(
  db: AppDatabase,
  userId: string,
): LearnerSignal[] {
  const rows = db
    .prepare(`
      SELECT
        d.slug AS domain,
        uf.rank AS focus_rank,
        COALESCE(sp.mastery, 0) AS mastery,
        COALESCE(sp.confidence, uf.confidence, 25) AS confidence,
        CASE
          WHEN COALESCE(sp.attempts, 0) = 0 THEN 0
          ELSE ROUND(sp.correct_answers * 100.0 / sp.attempts)
        END AS accuracy
      FROM domains d
      LEFT JOIN user_focus uf ON uf.domain_slug = d.slug AND uf.user_id = ?
      LEFT JOIN skill_progress sp ON sp.domain_slug = d.slug AND sp.user_id = ?
      ORDER BY d.priority
    `)
    .all(userId, userId) as Array<{
    domain: DomainSlug;
    focus_rank: number | null;
    mastery: number;
    confidence: number;
    accuracy: number;
  }>;

  return rows.map((row) => ({
    domain: row.domain,
    focusRank: row.focus_rank,
    mastery: row.mastery,
    confidence: row.confidence,
    accuracy: row.accuracy,
  }));
}

export function generateQuest(
  db: AppDatabase,
  userId: string,
  cadence: QuestCadence,
  date = new Date(),
): QuestView {
  const key = periodKey(date, cadencePeriod(cadence));
  const existing = db
    .prepare(
      "SELECT id FROM quest_instances WHERE user_id = ? AND cadence = ? AND period_key = ?",
    )
    .get(userId, cadence, key) as { id: string } | undefined;
  if (existing) return getQuest(db, userId, existing.id);

  const user = db
    .prepare("SELECT study_minutes FROM users WHERE id = ?")
    .get(userId) as { study_minutes: number } | undefined;
  if (!user) throw new AppError("Learner not found.", 404, "USER_NOT_FOUND");

  const templates = db
    .prepare(`
      SELECT qt.id, qt.domain_slug, qt.cadence, qt.duration_minutes,
        qt.difficulty, qt.prerequisites_json, d.priority
      FROM quest_templates qt
      JOIN domains d ON d.slug = qt.domain_slug
      WHERE qt.cadence = ? AND qt.active = 1
    `)
    .all(cadence) as TemplateRow[];
  const signals = getLearnerSignals(db, userId);
  const ranked = rankRecommendations(
    templates.map((template) => ({
      id: template.id,
      domain: template.domain_slug,
      difficulty: template.difficulty,
      durationMinutes: template.duration_minutes,
      prerequisites: JSON.parse(template.prerequisites_json) as DomainSlug[],
      priority: 11 - template.priority,
    })),
    signals,
    cadence === "daily" ? user.study_minutes : Math.max(user.study_minutes, 120),
  );

  if (ranked.length === 0) {
    throw new AppError(
      "No quest currently meets your prerequisites. Complete an introductory daily quest first.",
      409,
      "NO_ELIGIBLE_QUEST",
    );
  }

  const shortlist = ranked.slice(0, Math.min(3, ranked.length));
  const rotation = Number.parseInt(stableId(`${userId}:${cadence}:${key}`).slice(0, 6), 16);
  const selected = shortlist[rotation % shortlist.length];
  const questId = randomUUID();
  db.prepare(`
    INSERT INTO quest_instances(
      id, user_id, template_id, cadence, period_key, status, generated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(questId, userId, selected.id, cadence, key, date.toISOString());

  db.prepare(`
    INSERT INTO challenge_progress(
      user_id, template_id, status, percent, updated_at
    ) VALUES (?, ?, 'not_started', 0, ?)
    ON CONFLICT(user_id, template_id) DO NOTHING
  `).run(userId, selected.id, date.toISOString());

  return getQuest(db, userId, questId);
}

export function getQuest(
  db: AppDatabase,
  userId: string,
  questId: string,
): QuestView {
  const row = db
    .prepare(`
      SELECT qi.id, qi.template_id, qi.cadence, qi.period_key, qi.status,
        qi.generated_at, qi.completed_at, qt.domain_slug, qt.title, qt.summary,
        qt.duration_minutes, qt.difficulty, qt.challenge_mode,
        qt.prerequisites_json, qt.steps_json
      FROM quest_instances qi
      JOIN quest_templates qt ON qt.id = qi.template_id
      WHERE qi.id = ? AND qi.user_id = ?
    `)
    .get(questId, userId) as QuestJoinRow | undefined;
  if (!row) throw new AppError("Quest not found.", 404, "QUEST_NOT_FOUND");

  const completions = db
    .prepare(`
      SELECT step_id, step_type, score, response_json, completed_at
      FROM quest_step_completions
      WHERE quest_id = ?
    `)
    .all(questId) as CompletionRow[];
  const completionByStep = new Map(
    completions.map((completion) => [completion.step_id, completion]),
  );
  const templateSteps = JSON.parse(row.steps_json) as QuestStep[];
  const steps = templateSteps.map((step) => {
    const completion = completionByStep.get(step.id);
    return {
      ...step,
      completed: Boolean(completion),
      score: completion?.score ?? null,
      completedAt: completion?.completed_at ?? null,
    };
  });

  return {
    id: row.id,
    templateId: row.template_id,
    cadence: row.cadence,
    periodKey: row.period_key,
    status: row.status,
    generatedAt: row.generated_at,
    completedAt: row.completed_at,
    domain: row.domain_slug,
    title: row.title,
    summary: row.summary,
    durationMinutes: row.duration_minutes,
    difficulty: row.difficulty,
    challengeMode: row.challenge_mode,
    prerequisites: JSON.parse(row.prerequisites_json) as DomainSlug[],
    steps,
    progressPercent:
      steps.length === 0
        ? 0
        : Math.round((steps.filter((step) => step.completed).length / steps.length) * 100),
  };
}

export function listQuests(db: AppDatabase, userId: string): QuestView[] {
  const rows = db
    .prepare(`
      SELECT id
      FROM quest_instances
      WHERE user_id = ?
      ORDER BY status ASC, generated_at DESC
      LIMIT 12
    `)
    .all(userId) as Array<{ id: string }>;
  return rows.map((row) => getQuest(db, userId, row.id));
}

function awardXp(
  db: AppDatabase,
  input: {
    userId: string;
    eventKey: string;
    sourceType: string;
    sourceId: string;
    amount: number;
    description: string;
    now: string;
  },
): boolean {
  const result = db.prepare(`
    INSERT OR IGNORE INTO xp_ledger(
      id, user_id, event_key, source_type, source_id, amount, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    input.userId,
    input.eventKey,
    input.sourceType,
    input.sourceId,
    input.amount,
    input.description,
    input.now,
  );
  return result.changes === 1;
}

function updateSkill(
  db: AppDatabase,
  input: {
    userId: string;
    domain: DomainSlug;
    step: QuestStep;
    quizCorrect: boolean | null;
    now: string;
  },
): void {
  const masteryDelta =
    input.step.type === "raid"
      ? 15
      : input.step.type === "boss_battle"
        ? 10
        : input.step.type === "lab" || input.step.type === "challenge"
          ? 5
          : input.step.type === "quiz"
            ? input.quizCorrect
              ? 7
              : 1
            : 2;
  const confidenceDelta = input.quizCorrect === false ? -2 : Math.max(1, Math.ceil(masteryDelta / 2));
  const attemptDelta = input.step.type === "quiz" ? 1 : 0;
  const correctDelta = input.quizCorrect ? 1 : 0;

  db.prepare(`
    INSERT INTO skill_progress(
      user_id, domain_slug, mastery, confidence, attempts,
      correct_answers, completed_steps, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(user_id, domain_slug) DO UPDATE SET
      mastery = MIN(100, skill_progress.mastery + excluded.mastery),
      confidence = MIN(100, MAX(0, skill_progress.confidence + ?)),
      attempts = skill_progress.attempts + excluded.attempts,
      correct_answers = skill_progress.correct_answers + excluded.correct_answers,
      completed_steps = skill_progress.completed_steps + 1,
      updated_at = excluded.updated_at
  `).run(
    input.userId,
    input.domain,
    masteryDelta,
    Math.max(0, 25 + confidenceDelta),
    attemptDelta,
    correctDelta,
    input.now,
    confidenceDelta,
  );
}

function updateChallengeProgress(
  db: AppDatabase,
  userId: string,
  templateId: string,
  completedSteps: number,
  totalSteps: number,
  evidenceUrl: string | undefined,
  notes: string | undefined,
  now: string,
): void {
  const percent = Math.round((completedSteps / totalSteps) * 100);
  const status =
    percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started";
  db.prepare(`
    INSERT INTO challenge_progress(
      user_id, template_id, status, percent, evidence_url, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, template_id) DO UPDATE SET
      status=excluded.status,
      percent=excluded.percent,
      evidence_url=COALESCE(excluded.evidence_url, challenge_progress.evidence_url),
      notes=COALESCE(excluded.notes, challenge_progress.notes),
      updated_at=excluded.updated_at
  `).run(
    userId,
    templateId,
    status,
    percent,
    evidenceUrl ?? null,
    notes ?? null,
    now,
  );
}

function advanceAllStreaks(
  db: AppDatabase,
  userId: string,
  nowDate: Date,
): void {
  const now = nowDate.toISOString();
  for (const kind of ["daily", "weekly", "monthly"] as const) {
    const row = db
      .prepare(`
        SELECT count, best_count, last_period_key
        FROM streaks
        WHERE user_id = ? AND period_kind = ?
      `)
      .get(userId, kind) as
      | { count: number; best_count: number; last_period_key: string | null }
      | undefined;
    const updated = advanceStreak(
      {
        count: row?.count ?? 0,
        bestCount: row?.best_count ?? 0,
        lastPeriodKey: row?.last_period_key ?? null,
      },
      nowDate,
      kind,
    );
    db.prepare(`
      INSERT INTO streaks(
        user_id, period_kind, count, best_count, last_period_key, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, period_kind) DO UPDATE SET
        count=excluded.count,
        best_count=excluded.best_count,
        last_period_key=excluded.last_period_key,
        updated_at=excluded.updated_at
    `).run(
      userId,
      kind,
      updated.count,
      updated.bestCount,
      updated.lastPeriodKey,
      now,
    );

    if (kind === "daily") {
      const bonus = dailyStreakBonus(updated.count);
      if (bonus > 0) {
        awardXp(db, {
          userId,
          eventKey: `streak:daily:${updated.lastPeriodKey}`,
          sourceType: "streak",
          sourceId: updated.lastPeriodKey ?? now.slice(0, 10),
          amount: bonus,
          description: `${updated.count}-day streak bonus`,
          now,
        });
      }
    }
  }
}

function unlockAchievement(
  db: AppDatabase,
  userId: string,
  code: string,
  now: string,
): void {
  db.prepare(`
    INSERT OR IGNORE INTO user_achievements(user_id, achievement_code, unlocked_at)
    VALUES (?, ?, ?)
  `).run(userId, code, now);
}

function evaluateQuestAchievements(
  db: AppDatabase,
  userId: string,
  now: string,
): void {
  const firstLab = db
    .prepare(`
      SELECT 1
      FROM quest_step_completions qsc
      JOIN quest_instances qi ON qi.id = qsc.quest_id
      WHERE qi.user_id = ?
        AND qsc.step_type IN ('lab', 'challenge', 'boss_battle', 'raid')
      LIMIT 1
    `)
    .get(userId);
  if (firstLab) unlockAchievement(db, userId, "first-lab", now);

  const githubSteps = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM quest_step_completions qsc
      JOIN quest_instances qi ON qi.id = qsc.quest_id
      JOIN quest_templates qt ON qt.id = qi.template_id
      WHERE qi.user_id = ? AND qt.domain_slug LIKE 'github-%'
    `)
    .get(userId) as { count: number };
  if (githubSteps.count >= 3) {
    unlockAchievement(db, userId, "github-explorer", now);
  }

  const checks: Array<[string, string]> = [
    [
      "copilot-champion",
      "qt.domain_slug = 'github-copilot' AND qi.status = 'completed'",
    ],
    [
      "foundry-builder",
      "qt.domain_slug = 'azure-ai-foundry' AND qsc.step_type IN ('lab', 'challenge', 'boss_battle', 'raid')",
    ],
    [
      "ai-security-defender",
      "qt.domain_slug = 'ai-security' AND qsc.step_type = 'boss_battle'",
    ],
  ];
  for (const [code, condition] of checks) {
    const achieved = db
      .prepare(`
        SELECT 1
        FROM quest_instances qi
        JOIN quest_templates qt ON qt.id = qi.template_id
        LEFT JOIN quest_step_completions qsc ON qsc.quest_id = qi.id
        WHERE qi.user_id = ? AND ${condition}
        LIMIT 1
      `)
      .get(userId);
    if (achieved) unlockAchievement(db, userId, code, now);
  }
}

export function completeQuestStep(
  db: AppDatabase,
  input: {
    userId: string;
    questId: string;
    stepId: string;
    selectedIndex?: number;
    evidenceUrl?: string;
    notes?: string;
    date?: Date;
  },
): { quest: QuestView; xpAwarded: number; alreadyCompleted: boolean } {
  const nowDate = input.date ?? new Date();
  const now = nowDate.toISOString();
  const complete = db.transaction(() => {
    const quest = getQuest(db, input.userId, input.questId);
    const step = quest.steps.find((candidate) => candidate.id === input.stepId);
    if (!step) {
      throw new AppError("Quest step not found.", 404, "QUEST_STEP_NOT_FOUND");
    }
    if (step.completed) {
      return { xpAwarded: 0, alreadyCompleted: true };
    }

    let quizCorrect: boolean | null = null;
    let score: number | null = null;
    if (step.type === "quiz") {
      if (input.selectedIndex === undefined) {
        throw new AppError(
          "A quiz answer is required.",
          400,
          "QUIZ_ANSWER_REQUIRED",
        );
      }
      if (!step.quiz || input.selectedIndex >= step.quiz.options.length) {
        throw new AppError("The quiz answer is invalid.", 400, "INVALID_QUIZ_ANSWER");
      }
      quizCorrect = input.selectedIndex === step.quiz.answer;
      score = quizCorrect ? 100 : 0;
    }

    db.prepare(`
      INSERT INTO quest_step_completions(
        quest_id, step_id, step_type, score, response_json, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      quest.id,
      step.id,
      step.type,
      score,
      JSON.stringify({
        selectedIndex: input.selectedIndex,
        evidenceUrl: input.evidenceUrl,
        notes: input.notes,
      }),
      now,
    );

    const configured = db
      .prepare("SELECT amount FROM xp_config WHERE source_type = ?")
      .get(step.xpKey) as { amount: number } | undefined;
    const xpAmount =
      step.type === "quiz" && !quizCorrect ? 0 : (configured?.amount ?? 0);
    const inserted = awardXp(db, {
      userId: input.userId,
      eventKey: `quest:${quest.id}:step:${step.id}`,
      sourceType: step.xpKey,
      sourceId: quest.id,
      amount: xpAmount,
      description: `${quest.title}: ${step.title}`,
      now,
    });

    updateSkill(db, {
      userId: input.userId,
      domain: quest.domain,
      step,
      quizCorrect,
      now,
    });

    const completedSteps = db
      .prepare("SELECT COUNT(*) AS count FROM quest_step_completions WHERE quest_id = ?")
      .get(quest.id) as { count: number };
    updateChallengeProgress(
      db,
      input.userId,
      quest.templateId,
      completedSteps.count,
      quest.steps.length,
      input.evidenceUrl,
      input.notes,
      now,
    );

    if (completedSteps.count === quest.steps.length) {
      db.prepare(`
        UPDATE quest_instances
        SET status = 'completed', completed_at = ?
        WHERE id = ? AND status = 'active'
      `).run(now, quest.id);
      advanceAllStreaks(db, input.userId, nowDate);
    }
    evaluateQuestAchievements(db, input.userId, now);
    return {
      xpAwarded: inserted ? xpAmount : 0,
      alreadyCompleted: false,
    };
  });

  const result = complete();
  return {
    ...result,
    quest: getQuest(db, input.userId, input.questId),
  };
}

export function updateChallenge(
  db: AppDatabase,
  input: {
    userId: string;
    templateId: string;
    percent: number;
    evidenceUrl?: string | null;
    notes?: string | null;
  },
): void {
  const exists = db
    .prepare("SELECT 1 FROM quest_templates WHERE id = ?")
    .get(input.templateId);
  if (!exists) throw new AppError("Challenge not found.", 404, "CHALLENGE_NOT_FOUND");
  const status =
    input.percent === 100
      ? "completed"
      : input.percent > 0
        ? "in_progress"
        : "not_started";
  db.prepare(`
    INSERT INTO challenge_progress(
      user_id, template_id, status, percent, evidence_url, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, template_id) DO UPDATE SET
      status=excluded.status,
      percent=excluded.percent,
      evidence_url=excluded.evidence_url,
      notes=excluded.notes,
      updated_at=excluded.updated_at
  `).run(
    input.userId,
    input.templateId,
    status,
    input.percent,
    input.evidenceUrl ?? null,
    input.notes ?? null,
    new Date().toISOString(),
  );
}

export function saveOnboarding(
  db: AppDatabase,
  input: {
    userId: string;
    studyMinutes: number;
    focusAreas: DomainSlug[];
    confidence?: Partial<Record<DomainSlug, number>>;
  },
): void {
  const save = db.transaction(() => {
    const now = new Date().toISOString();
    db.prepare("DELETE FROM user_focus WHERE user_id = ?").run(input.userId);
    const focusStatement = db.prepare(`
      INSERT INTO user_focus(user_id, domain_slug, rank, confidence)
      VALUES (?, ?, ?, ?)
    `);
    const skillStatement = db.prepare(`
      INSERT INTO skill_progress(
        user_id, domain_slug, mastery, confidence, attempts,
        correct_answers, completed_steps, updated_at
      ) VALUES (?, ?, 0, ?, 0, 0, 0, ?)
      ON CONFLICT(user_id, domain_slug) DO UPDATE SET
        confidence=excluded.confidence,
        updated_at=excluded.updated_at
    `);
    input.focusAreas.forEach((domain, index) => {
      const confidence = input.confidence?.[domain] ?? 25;
      focusStatement.run(input.userId, domain, index + 1, confidence);
      skillStatement.run(input.userId, domain, confidence, now);
    });
    db.prepare(`
      UPDATE users
      SET study_minutes = ?, onboarding_complete = 1, updated_at = ?
      WHERE id = ?
    `).run(input.studyMinutes, now, input.userId);
  });
  save();
}

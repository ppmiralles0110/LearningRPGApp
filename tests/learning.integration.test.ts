import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "@/lib/db";
import { createDatabase } from "@/lib/db";
import {
  completeQuestStep,
  generateQuest,
  setQuestGuideCheckpoint,
} from "@/lib/services/learning";
import { startExam, submitExam } from "@/lib/services/exams";

describe("persistent learning flows", () => {
  let db: AppDatabase;
  let userId: string;

  beforeEach(() => {
    db = createDatabase(":memory:");
    userId = (
      db.prepare("SELECT id FROM users WHERE email=?").get("demo@levelup.local") as {
        id: string;
      }
    ).id;
  });

  afterEach(() => {
    db.close();
  });

  it("records quest XP exactly once and completes streaks transactionally", () => {
    const date = new Date("2026-09-15T07:00:00.000Z");
    let quest = generateQuest(db, userId, "daily", date);
    const firstStep = quest.steps[0];
    const first = completeQuestStep(db, {
      userId,
      questId: quest.id,
      stepId: firstStep.id,
      date,
    });
    const duplicate = completeQuestStep(db, {
      userId,
      questId: quest.id,
      stepId: firstStep.id,
      date,
    });
    expect(first.xpAwarded).toBeGreaterThan(0);
    expect(duplicate).toMatchObject({ xpAwarded: 0, alreadyCompleted: true });

    quest = duplicate.quest;
    for (const step of quest.steps.filter((item) => !item.completed)) {
      for (const checkpoint of step.guide?.checkpoints ?? []) {
        quest = setQuestGuideCheckpoint(db, {
          userId,
          questId: quest.id,
          stepId: step.id,
          checkpointId: checkpoint.id,
          completed: true,
          date,
        });
      }
      completeQuestStep(db, {
        userId,
        questId: quest.id,
        stepId: step.id,
        selectedIndex: step.quiz?.answer,
        date,
      });
    }

    const completed = db
      .prepare("SELECT status FROM quest_instances WHERE id=?")
      .get(quest.id) as { status: string };
    const ledgerCount = db
      .prepare(
        "SELECT COUNT(*) AS count FROM xp_ledger WHERE user_id=? AND event_key LIKE ?",
      )
      .get(userId, `quest:${quest.id}:step:%`) as { count: number };
    const streak = db
      .prepare(
        "SELECT count FROM streaks WHERE user_id=? AND period_kind='daily'",
      )
      .get(userId) as { count: number };
    expect(completed.status).toBe("completed");
    expect(ledgerCount.count).toBe(quest.steps.length);
    expect(streak.count).toBe(1);
  });

  it("persists ordered guide checkpoints and gates hands-on completion", () => {
    const date = new Date("2026-09-16T07:00:00.000Z");
    let quest = generateQuest(db, userId, "daily", date);
    const guidedStep = quest.steps.find((step) => step.guide);
    expect(guidedStep?.guide?.checkpoints).toHaveLength(4);
    if (!guidedStep?.guide) throw new Error("Expected a guided hands-on step.");
    const checkpoints = guidedStep.guide.checkpoints;

    expect(() =>
      completeQuestStep(db, {
        userId,
        questId: quest.id,
        stepId: guidedStep.id,
        date,
      }),
    ).toThrowError(/guided checkpoint/i);
    expect(() =>
      setQuestGuideCheckpoint(db, {
        userId,
        questId: quest.id,
        stepId: guidedStep.id,
        checkpointId: checkpoints[1].id,
        completed: true,
        date,
      }),
    ).toThrowError(/earlier checkpoints/i);

    for (const checkpoint of checkpoints) {
      quest = setQuestGuideCheckpoint(db, {
        userId,
        questId: quest.id,
        stepId: guidedStep.id,
        checkpointId: checkpoint.id,
        completed: true,
        date,
      });
    }
    setQuestGuideCheckpoint(db, {
      userId,
      questId: quest.id,
      stepId: guidedStep.id,
      checkpointId: checkpoints[3].id,
      completed: true,
      date,
    });
    const checkpointCount = db
      .prepare(
        "SELECT COUNT(*) AS count FROM quest_guide_checkpoints WHERE quest_id=? AND step_id=?",
      )
      .get(quest.id, guidedStep.id) as { count: number };
    expect(checkpointCount.count).toBe(4);

    const completed = completeQuestStep(db, {
      userId,
      questId: quest.id,
      stepId: guidedStep.id,
      date,
    });
    expect(
      completed.quest.steps.find((step) => step.id === guidedStep.id)?.completed,
    ).toBe(true);
  });

  it("persists timed exam results and weak-topic remediation", () => {
    const startedAt = new Date("2026-09-15T08:00:00.000Z");
    const attempt = startExam(db, {
      userId,
      certificationCode: "GH-FOUNDATIONS",
      difficulty: 3,
      durationMinutes: 90,
      now: startedAt,
    });
    const answers = Object.fromEntries(
      attempt.questions.map((question) => [question.id, 0]),
    );
    const result = submitExam(db, {
      userId,
      attemptId: attempt.id,
      answers,
      now: new Date("2026-09-15T08:10:00.000Z"),
    });
    expect(result.status).toBe("submitted");
    expect(attempt.questions).toHaveLength(60);
    expect(result.result?.total).toBe(60);
    expect(result.review).toHaveLength(60);
    expect(
      db
        .prepare("SELECT readiness FROM user_certification_progress WHERE user_id=? AND certification_code=?")
        .get(userId, "GH-FOUNDATIONS"),
    ).toBeTruthy();

    const nextAttempt = startExam(db, {
      userId,
      certificationCode: "GH-FOUNDATIONS",
      difficulty: 3,
      durationMinutes: 90,
      now: new Date("2026-09-15T08:20:00.000Z"),
    });
    expect(nextAttempt.questions).toHaveLength(60);
    expect(nextAttempt.questions.map((question) => question.id)).not.toEqual(
      attempt.questions.map((question) => question.id),
    );
  });

  it("creates the current schema including checkpoint and certificate persistence", () => {
    expect(db.pragma("user_version", { simple: true })).toBe(4);
    for (const tableName of [
      "quest_guide_checkpoints",
      "user_certificates",
    ]) {
      const table = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        )
        .get(tableName);
      expect(table).toBeTruthy();
    }
  });
});

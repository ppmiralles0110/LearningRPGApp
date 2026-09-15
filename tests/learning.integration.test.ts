import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "@/lib/db";
import { createDatabase } from "@/lib/db";
import {
  completeQuestStep,
  generateQuest,
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

  it("persists timed exam results and weak-topic remediation", () => {
    const startedAt = new Date("2026-09-15T08:00:00.000Z");
    const attempt = startExam(db, {
      userId,
      certificationCode: "GH-FOUNDATIONS",
      difficulty: 3,
      durationMinutes: 30,
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
    expect(result.result?.total).toBe(attempt.questions.length);
    expect(result.review).toHaveLength(attempt.questions.length);
    expect(
      db
        .prepare("SELECT readiness FROM user_certification_progress WHERE user_id=? AND certification_code=?")
        .get(userId, "GH-FOUNDATIONS"),
    ).toBeTruthy();
  });
});

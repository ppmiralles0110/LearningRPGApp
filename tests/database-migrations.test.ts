import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "@/lib/db";
import { seedDatabase } from "@/lib/db/seed";
import { schemaSql } from "@/lib/db/schema";

describe("database migrations", () => {
  let temporaryDirectory: string | null = null;

  afterEach(() => {
    if (temporaryDirectory) {
      rmSync(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = null;
    }
  });

  it("upgrades a version 1 database without losing existing users", () => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "levelup-migration-"));
    const filename = path.join(temporaryDirectory, "levelup.db");
    const previous = new Database(filename);
    previous.exec(schemaSql);
    previous.exec(`
      DROP TABLE quest_guide_checkpoints;
      DROP TABLE user_certificates;
      ALTER TABLE exam_questions DROP COLUMN active;
    `);
    previous
      .prepare(
        "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, ?)",
      )
      .run("2026-01-01T00:00:00.000Z");
    previous.pragma("user_version = 1");
    previous.close();

    const upgraded = createDatabase(filename);
    expect(upgraded.pragma("user_version", { simple: true })).toBe(4);
    expect(
      upgraded
        .prepare(
          "SELECT COUNT(*) AS count FROM schema_migrations WHERE version IN (1, 2, 3, 4)",
        )
        .get(),
    ).toEqual({ count: 4 });
    for (const tableName of [
      "quest_guide_checkpoints",
      "user_certificates",
    ]) {
      expect(
        upgraded
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          )
          .get(tableName),
      ).toBeTruthy();
    }
    expect(
      (
        upgraded.pragma("table_info(exam_questions)") as Array<{
          name: string;
        }>
      ).some((column) => column.name === "active"),
    ).toBe(true);
    upgraded.prepare(`
      INSERT INTO exam_questions(
        id, certification_code, question_type, difficulty, domain_slug,
        prompt, options_json, answer_index, explanation, active
      ) VALUES (
        'retired-question', 'GH-FOUNDATIONS', 'multiple_choice', 1,
        'github-fundamentals', 'Retired?', '["Yes","No"]', 0, 'Old content', 1
      )
    `).run();
    seedDatabase(upgraded);
    expect(
      upgraded
        .prepare("SELECT active FROM exam_questions WHERE id='retired-question'")
        .get(),
    ).toEqual({ active: 0 });
    upgraded.close();
  });
});

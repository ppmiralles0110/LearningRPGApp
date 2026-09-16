import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  migrationV2Sql,
  migrationV3Sql,
  schemaSql,
  SCHEMA_VERSION,
} from "@/lib/db/schema";
import { seedDatabase } from "@/lib/db/seed";

export type AppDatabase = Database.Database;

function databasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "levelup-architect.db");
}

export function createDatabase(filename = databasePath()): AppDatabase {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (filename !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }

  const currentVersion = db.pragma("user_version", { simple: true }) as number;
  if (currentVersion > SCHEMA_VERSION) {
    db.close();
    throw new Error(
      `Database schema version ${currentVersion} is newer than this application supports (${SCHEMA_VERSION}).`,
    );
  }
  if (currentVersion < 1) {
    const migrate = db.transaction(() => {
      db.exec(schemaSql);
      db.prepare(
        "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)",
      ).run(1, new Date().toISOString());
      db.pragma("user_version = 1");
    });
    migrate();
  }
  if (currentVersion < 2) {
    const migrate = db.transaction(() => {
      db.exec(migrationV2Sql);
      db.prepare(
        "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)",
      ).run(2, new Date().toISOString());
      db.pragma("user_version = 2");
    });
    migrate();
  }
  if (currentVersion < 3) {
    const migrate = db.transaction(() => {
      db.exec(migrationV3Sql);
      db.prepare(
        "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)",
      ).run(3, new Date().toISOString());
      db.pragma("user_version = 3");
    });
    migrate();
  }
  if (currentVersion < 4) {
    const columns = db.pragma("table_info(exam_questions)") as Array<{
      name: string;
    }>;
    const migrate = db.transaction(() => {
      if (!columns.some((column) => column.name === "active")) {
        db.exec(
          "ALTER TABLE exam_questions ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))",
        );
      }
      db.prepare(
        "INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)",
      ).run(4, new Date().toISOString());
      db.pragma("user_version = 4");
    });
    migrate();
  }

  seedDatabase(db);
  return db;
}

const globalForDatabase = globalThis as unknown as {
  levelUpDatabase?: AppDatabase;
};

export function getDatabase(): AppDatabase {
  if (!globalForDatabase.levelUpDatabase) {
    globalForDatabase.levelUpDatabase = createDatabase();
  }
  return globalForDatabase.levelUpDatabase;
}

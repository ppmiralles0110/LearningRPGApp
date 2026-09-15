import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { schemaSql, SCHEMA_VERSION } from "@/lib/db/schema";
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

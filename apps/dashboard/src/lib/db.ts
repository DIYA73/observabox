import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(path.join(DATA_DIR, "observabox.db"));
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      api_key     TEXT UNIQUE NOT NULL,
      owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      condition_json TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      enabled     INTEGER DEFAULT 1,
      last_fired_at INTEGER,
      created_at  INTEGER DEFAULT (unixepoch())
    );
  `);
}

// ── Typed helpers ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
}

export interface Project {
  id: string;
  name: string;
  api_key: string;
  owner_id: string;
  created_at: number;
}

export interface AlertRule {
  id: string;
  project_id: string;
  name: string;
  type: "log_error_rate" | "metric_threshold";
  condition_json: string;
  webhook_url: string;
  enabled: number;
  last_fired_at: number | null;
  created_at: number;
}

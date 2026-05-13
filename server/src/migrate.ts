import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Migration {
  up: (db: DatabaseSync) => void;
  down: (db: DatabaseSync) => void;
}

function ensureMigrationsTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function getAppliedMigrations(db: DatabaseSync): Set<string> {
  const rows = db
    .prepare('SELECT filename FROM schema_migrations ORDER BY filename ASC')
    .all() as unknown as { filename: string }[];
  return new Set(rows.map((r) => r.filename));
}

function recordMigration(db: DatabaseSync, filename: string): void {
  db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(filename);
}

export async function runMigrations(db: DatabaseSync): Promise<void> {
  ensureMigrationsTable(db);

  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const applied = getAppliedMigrations(db);

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const moduleUrl = new URL(
      `file://${path.join(migrationsDir, file).replace(/\\/g, '/')}`
    ).href;
    const migration = (await import(moduleUrl)) as Migration;

    db.exec('BEGIN');
    try {
      migration.up(db);
      recordMigration(db, file);
      db.exec('COMMIT');
      console.log(`[migrate] Applied: ${file}`);
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(
        `Migration ${file} failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
}

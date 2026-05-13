import { DatabaseSync } from 'node:sqlite';

export function up(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE feature_flags (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.prepare('INSERT INTO feature_flags (key, value) VALUES (?, ?)').run(
    'workspace_switcher_enabled',
    'false'
  );
}

export function down(db: DatabaseSync): void {
  db.exec('DROP TABLE IF EXISTS feature_flags');
}

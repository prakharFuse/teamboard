import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { runMigrations } from './migrations/001_add_workspaces.js';

const DB_PATH = path.join(process.cwd(), 'data', 'team.db');

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);

    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        start_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    runMigrations(db);

    const count = db.prepare('SELECT COUNT(*) as count FROM members').get() as unknown as { count: number };
    if (count.count === 0) {
      const workspace = db.prepare('SELECT id FROM workspaces WHERE slug = ?').get('parent-co') as unknown as { id: number };
      const workspaceId = workspace.id;
      const insert = db.prepare(
        'INSERT INTO members (workspace_id, name, email, role, department, start_date) VALUES (?, ?, ?, ?, ?, ?)'
      );
      insert.run(workspaceId, 'Alice Chen', 'alice.chen@company.com', 'Senior Engineer', 'Engineering', '2022-03-15');
      insert.run(workspaceId, 'Bob Martinez', 'bob.martinez@company.com', 'Product Manager', 'Product', '2021-07-01');
      insert.run(workspaceId, 'Carol Smith', 'carol.smith@company.com', 'Designer', 'Design', '2023-01-10');
      insert.run(workspaceId, 'David Kim', 'david.kim@company.com', 'Engineer', 'Engineering', '2023-06-20');
      insert.run(workspaceId, 'Eva Johansson', 'eva.johansson@company.com', 'Marketing Lead', 'Marketing', '2022-11-05');
      insert.run(workspaceId, 'Frank Osei', 'frank.osei@company.com', 'Sales Rep', 'Sales', '2024-02-14');
      insert.run(workspaceId, 'Grace Lin', 'grace.lin@company.com', 'HR Coordinator', 'HR', '2021-04-01');
      insert.run(workspaceId, 'Hiro Tanaka', 'hiro.tanaka@company.com', 'DevOps Engineer', 'Engineering', '2023-09-12');
    }
  }
  return db;
}

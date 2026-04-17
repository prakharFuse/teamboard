import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { LEGACY_NAME_TO_CODE } from '../departments.js';

const DB_PATH = path.join(process.cwd(), 'data', 'team.db');

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);

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

    // Idempotent migration: normalise any pre-existing rows that store legacy
    // department display names (e.g. 'Engineering', 'Eng', 'Human Resources')
    // to their canonical dept_codes. Safe no-op on subsequent startups because
    // the WHERE clause will match zero rows once codes are already stored.
    const normaliseDept = db.prepare(
      'UPDATE members SET department = ? WHERE department = ?'
    );
    for (const [legacyName, code] of Object.entries(LEGACY_NAME_TO_CODE)) {
      normaliseDept.run(code, legacyName);
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM members').get() as unknown as { count: number };
    if (count.count === 0) {
      const insert = db.prepare(
        'INSERT INTO members (name, email, role, department, start_date) VALUES (?, ?, ?, ?, ?)'
      );
      insert.run('Alice Chen', 'alice.chen@company.com', 'Senior Engineer', 'ENG', '2022-03-15');
      insert.run('Bob Martinez', 'bob.martinez@company.com', 'Product Manager', 'PROD', '2021-07-01');
      insert.run('Carol Smith', 'carol.smith@company.com', 'Designer', 'DES', '2023-01-10');
      insert.run('David Kim', 'david.kim@company.com', 'Engineer', 'ENG', '2023-06-20');
      insert.run('Eva Johansson', 'eva.johansson@company.com', 'Marketing Lead', 'MKT', '2022-11-05');
      insert.run('Frank Osei', 'frank.osei@company.com', 'Sales Rep', 'SAL', '2024-02-14');
      insert.run('Grace Lin', 'grace.lin@company.com', 'HR Coordinator', 'HR', '2021-04-01');
      insert.run('Hiro Tanaka', 'hiro.tanaka@company.com', 'DevOps Engineer', 'ENG', '2023-09-12');
    }
  }
  return db;
}

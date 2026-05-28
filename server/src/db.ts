// server/src/db.ts — SQLite singleton initialization and seed data (TeamBoard)
// PEOPLE-OPS REVIEW NOTE (KB Doc 4): Any PR that modifies the members table schema
// (adding columns, changing types, renaming fields) must be reviewed by People Ops
// before merging so they can verify BambooHR compatibility.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { legacyDeptToCode, getDeptName } from './departments.js';

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
        dept_code TEXT NOT NULL DEFAULT '',
        start_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Defensive migration: add dept_code on existing databases that pre-date this column.
    // PRAGMA table_info returns one row per column; we look for 'dept_code' by name.
    const tableInfo = db.prepare('PRAGMA table_info(members)').all() as unknown as { name: string }[];
    const hasDeptCode = tableInfo.some(col => col.name === 'dept_code');
    if (!hasDeptCode) {
      db.exec("ALTER TABLE members ADD COLUMN dept_code TEXT NOT NULL DEFAULT ''");
    }

    // One-shot backfill: map legacy free-text `department` → `dept_code` for any row
    // whose dept_code is still blank (i.e. pre-migration data or fresh ALTER TABLE rows).
    // Rows that cannot be mapped are warned but NOT thrown — manual review handles them.
    const staleRows = db.prepare(
      "SELECT id, department FROM members WHERE dept_code = ''"
    ).all() as unknown as { id: number; department: string }[];
    const updateCode = db.prepare('UPDATE members SET dept_code = ? WHERE id = ?');
    const unmapped: string[] = [];
    for (const row of staleRows) {
      const code = legacyDeptToCode(row.department);
      if (code) {
        updateCode.run(code, row.id);
      } else {
        unmapped.push(`id=${row.id} department="${row.department}"`);
      }
    }
    if (unmapped.length > 0) {
      console.warn(
        '[db] Backfill: could not map dept_code for the following rows — manual review required:\n  ' +
        unmapped.join('\n  ')
      );
    }

    // Type-safe wrapper used only for seed data: throws at startup if a code is
    // unrecognised, catching typos before they silently store '' in a NOT NULL column.
    const deptNameOrThrow = (code: string): string => {
      const name = getDeptName(code);
      if (name === undefined) {
        throw new Error(`[db] Unknown dept_code in seed data: "${code}"`);
      }
      return name;
    };

    const count = db.prepare('SELECT COUNT(*) as count FROM members').get() as unknown as { count: number };
    if (count.count === 0) {
      const insert = db.prepare(
        'INSERT INTO members (name, email, role, department, dept_code, start_date) VALUES (?, ?, ?, ?, ?, ?)'
      );
      // Canonical (department, dept_code) pairs — department text is resolved via
      // deptNameOrThrow so a bad code throws at server start rather than inserting NULL.
      insert.run('Alice Chen',    'alice.chen@company.com',    'Senior Engineer',  deptNameOrThrow('ENGR'), 'ENGR', '2022-03-15');
      insert.run('Bob Martinez',  'bob.martinez@company.com',  'Product Manager',  deptNameOrThrow('PROD'), 'PROD', '2021-07-01');
      insert.run('Carol Smith',   'carol.smith@company.com',   'Designer',         deptNameOrThrow('DSGN'), 'DSGN', '2023-01-10');
      insert.run('David Kim',     'david.kim@company.com',     'Engineer',         deptNameOrThrow('ENGR'), 'ENGR', '2023-06-20'); // was 'Eng'
      insert.run('Eva Johansson', 'eva.johansson@company.com', 'Marketing Lead',   deptNameOrThrow('MKTG'), 'MKTG', '2022-11-05');
      insert.run('Frank Osei',    'frank.osei@company.com',    'Sales Rep',        deptNameOrThrow('SALE'), 'SALE', '2024-02-14');
      insert.run('Grace Lin',     'grace.lin@company.com',     'HR Coordinator',   deptNameOrThrow('HRES'), 'HRES', '2021-04-01'); // was 'Human Resources'
      insert.run('Hiro Tanaka',   'hiro.tanaka@company.com',   'DevOps Engineer',  deptNameOrThrow('ENGR'), 'ENGR', '2023-09-12'); // was 'Eng'
    }
  }
  return db;
}

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

let db: DatabaseSync;

// ---------------------------------------------------------------------------
// Audit log types & helper
// ---------------------------------------------------------------------------

export interface AuditEntry {
  actor_email: string;
  workspace_id: number;
  action: string;
  entity_id?: number | null;
}

export function writeAuditLog(db: DatabaseSync, entry: AuditEntry): void {
  db.prepare(
    `INSERT INTO audit_log (actor_email, workspace_id, action, entity_id, at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(
    entry.actor_email,
    entry.workspace_id,
    entry.action,
    entry.entity_id ?? null
  );
}

// ---------------------------------------------------------------------------
// Canonical department list for Parent Co
// ---------------------------------------------------------------------------

const PARENT_CO_DEPARTMENTS: string[] = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
];

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

function hasMigration(db: DatabaseSync, version: number): boolean {
  const row = db
    .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
    .get(version) as unknown as object | undefined;
  return row !== undefined;
}

function recordMigration(db: DatabaseSync, version: number): void {
  db.prepare(
    `INSERT INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`
  ).run(version);
}

// ---------------------------------------------------------------------------
// Migration 001 – workspaces table + seed rows
// ---------------------------------------------------------------------------

function migration001(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      bamboohr_dept_code_list TEXT NOT NULL DEFAULT '[]',
      okta_group TEXT
    )
  `);

  const insertWorkspace = db.prepare(
    `INSERT OR IGNORE INTO workspaces (slug, name) VALUES (?, ?)`
  );
  insertWorkspace.run('parent-co', 'Parent Co');
  insertWorkspace.run('brightline', 'Brightline');
  insertWorkspace.run('northstar-logistics', 'Northstar Logistics');
  insertWorkspace.run('helio-studios', 'Helio Studios');

  recordMigration(db, 1);
}

// ---------------------------------------------------------------------------
// Migration 002 – departments table + seed Parent Co rows
// ---------------------------------------------------------------------------

function migration002(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, name)
    )
  `);

  const parentCo = db
    .prepare(`SELECT id FROM workspaces WHERE slug = 'parent-co'`)
    .get() as unknown as { id: number } | undefined;

  if (parentCo) {
    const insertDept = db.prepare(
      `INSERT OR IGNORE INTO departments (workspace_id, name) VALUES (?, ?)`
    );
    for (const dept of PARENT_CO_DEPARTMENTS) {
      insertDept.run(parentCo.id, dept);
    }
  }

  recordMigration(db, 2);
}

// ---------------------------------------------------------------------------
// Migration 003 – audit_log table
// ---------------------------------------------------------------------------

function migration003(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email TEXT NOT NULL,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
      action TEXT NOT NULL,
      entity_id INTEGER,
      at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  recordMigration(db, 3);
}

// ---------------------------------------------------------------------------
// Migration 004 – rebuild members table to add workspace_id + new UNIQUE constraint
// ---------------------------------------------------------------------------

function migration004(db: DatabaseSync): void {
  // Use PRAGMA table_info to make this migration idempotent
  const columns = db
    .prepare('PRAGMA table_info(members)')
    .all() as unknown as Array<{ name: string }>;
  const hasWorkspaceId = columns.some((col) => col.name === 'workspace_id');

  if (!hasWorkspaceId) {
    db.exec(`
      BEGIN;
      CREATE TABLE members_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        start_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        workspace_id INTEGER NOT NULL DEFAULT 1,
        UNIQUE(email, workspace_id)
      );
      INSERT INTO members_new SELECT *, 1 FROM members;
      DROP TABLE members;
      ALTER TABLE members_new RENAME TO members;
      COMMIT;
    `);
  }

  recordMigration(db, 4);
}

// ---------------------------------------------------------------------------
// Migration 005 – backfill guard: ensure all members have a valid workspace_id
// ---------------------------------------------------------------------------

function migration005(db: DatabaseSync): void {
  db.prepare(
    `UPDATE members
     SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'parent-co')
     WHERE workspace_id IS NULL OR workspace_id = 0`
  ).run();

  recordMigration(db, 5);
}

// ---------------------------------------------------------------------------
// runMigrations – called inside getDb() before any seed logic
// ---------------------------------------------------------------------------

function runMigrations(db: DatabaseSync): void {
  // Ensure the migrations registry table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  if (!hasMigration(db, 1)) migration001(db);
  if (!hasMigration(db, 2)) migration002(db);
  if (!hasMigration(db, 3)) migration003(db);
  if (!hasMigration(db, 4)) migration004(db);
  if (!hasMigration(db, 5)) migration005(db);
}

// ---------------------------------------------------------------------------
// getDb – singleton entry-point
// ---------------------------------------------------------------------------

export function getDb(): DatabaseSync {
  if (!db) {
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.cwd(), process.env.DB_PATH)
      : path.join(process.cwd(), 'data', 'team.db');

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);

    // Bootstrap the original members table (legacy schema) so migration 004
    // always has something to upgrade when starting from scratch.
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

    // Run all pending migrations before touching any data
    runMigrations(db);

    // Seed members only when the table is empty
    const count = db
      .prepare('SELECT COUNT(*) as count FROM members')
      .get() as unknown as { count: number };

    if (count.count === 0) {
      const insert = db.prepare(
        'INSERT INTO members (name, email, role, department, start_date) VALUES (?, ?, ?, ?, ?)'
      );
      insert.run('Alice Chen', 'alice.chen@company.com', 'Senior Engineer', 'Engineering', '2022-03-15');
      insert.run('Bob Martinez', 'bob.martinez@company.com', 'Product Manager', 'Product', '2021-07-01');
      insert.run('Carol Smith', 'carol.smith@company.com', 'Designer', 'Design', '2023-01-10');
      insert.run('David Kim', 'david.kim@company.com', 'Engineer', 'Engineering', '2023-06-20');
      insert.run('Eva Johansson', 'eva.johansson@company.com', 'Marketing Lead', 'Marketing', '2022-11-05');
      insert.run('Frank Osei', 'frank.osei@company.com', 'Sales Rep', 'Sales', '2024-02-14');
      insert.run('Grace Lin', 'grace.lin@company.com', 'HR Coordinator', 'Human Resources', '2021-04-01');
      insert.run('Hiro Tanaka', 'hiro.tanaka@company.com', 'DevOps Engineer', 'Engineering', '2023-09-12');
    }
  }
  return db;
}

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'team.db');

let db: DatabaseSync;

function applyMigrations(database: DatabaseSync): void {
  // Migration: add workspace_id to members table
  // Renames the original members table to members_backup, creates a new members
  // table with workspace_id NOT NULL DEFAULT 1 + UNIQUE(email, workspace_id),
  // copies all rows across (assigning workspace_id = 1), then records the
  // migration so it never runs again.
  const migrationName = 'add_workspace_id_to_members';
  const applied = database.prepare(
    'SELECT 1 FROM schema_migrations WHERE name = ?'
  ).get(migrationName);

  if (applied) {
    return;
  }

  database.exec('BEGIN');
  try {
    database.exec('ALTER TABLE members RENAME TO members_backup');

    database.exec(`
      CREATE TABLE members (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        role        TEXT NOT NULL,
        department  TEXT NOT NULL,
        start_date  TEXT NOT NULL,
        is_active   INTEGER NOT NULL DEFAULT 1,
        workspace_id INTEGER NOT NULL DEFAULT 1,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(email, workspace_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
      )
    `);

    database.exec(`
      INSERT INTO members
        (id, name, email, role, department, start_date, is_active, workspace_id, created_at, updated_at)
      SELECT
        id, name, email, role, department, start_date, is_active, 1, created_at, updated_at
      FROM members_backup
    `);

    database.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(migrationName);

    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

export function getDb(): DatabaseSync {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);

    // Migration bookkeeping — must exist before applyMigrations() is called.
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Workspaces — one row per legal entity / tenant.
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id                     INTEGER PRIMARY KEY AUTOINCREMENT,
        slug                   TEXT NOT NULL UNIQUE,
        name                   TEXT NOT NULL,
        bamboohr_dept_code_list TEXT NOT NULL DEFAULT '[]',
        okta_group             TEXT
      )
    `);

    // Departments — per-workspace catalogue of valid department codes.
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        name         TEXT NOT NULL,
        workspace_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
        UNIQUE(name, workspace_id)
      )
    `);

    // Audit log — every member create / update / delete and every export is
    // recorded here for SOC 2 compliance.
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_email  TEXT NOT NULL,
        workspace_id INTEGER NOT NULL,
        action       TEXT NOT NULL,
        entity_id    INTEGER,
        at           TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
      )
    `);

    // Members — created with the legacy schema first; applyMigrations() will
    // replace it with the workspace-aware schema if not already done.
    db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL UNIQUE,
        role        TEXT NOT NULL,
        department  TEXT NOT NULL,
        start_date  TEXT NOT NULL,
        is_active   INTEGER NOT NULL DEFAULT 1,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Run any pending migrations (idempotent — safe to call on every startup).
    applyMigrations(db);

    // Seed workspaces only when the table is empty (first run / test reset).
    const wsCount = db.prepare('SELECT COUNT(*) as count FROM workspaces').get() as unknown as { count: number };
    if (wsCount.count === 0) {
      const insertWs = db.prepare('INSERT INTO workspaces (slug, name) VALUES (?, ?)');
      insertWs.run('parent-co', 'Parent Co');
      insertWs.run('brightline', 'Brightline');
      insertWs.run('northstar-logistics', 'Northstar Logistics');
      insertWs.run('helio-studios', 'Helio Studios');
    }

    // Seed demo members only when the table is empty.
    const count = db.prepare('SELECT COUNT(*) as count FROM members').get() as unknown as { count: number };
    if (count.count === 0) {
      const insert = db.prepare(
        'INSERT INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)'
      );
      insert.run('Alice Chen',     'alice.chen@company.com',     'Senior Engineer',  'Engineering',     '2022-03-15', 1);
      insert.run('Bob Martinez',   'bob.martinez@company.com',   'Product Manager',  'Product',         '2021-07-01', 1);
      insert.run('Carol Smith',    'carol.smith@company.com',    'Designer',         'Design',          '2023-01-10', 1);
      insert.run('David Kim',      'david.kim@company.com',      'Engineer',         'Eng',             '2023-06-20', 1);
      insert.run('Eva Johansson',  'eva.johansson@company.com',  'Marketing Lead',   'Marketing',       '2022-11-05', 1);
      insert.run('Frank Osei',     'frank.osei@company.com',     'Sales Rep',        'Sales',           '2024-02-14', 1);
      insert.run('Grace Lin',      'grace.lin@company.com',      'HR Coordinator',   'Human Resources', '2021-04-01', 1);
      insert.run('Hiro Tanaka',    'hiro.tanaka@company.com',    'DevOps Engineer',  'Eng',             '2023-09-12', 1);
    }
  }
  return db;
}

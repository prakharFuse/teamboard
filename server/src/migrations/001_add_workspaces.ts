import { DatabaseSync } from 'node:sqlite';

export function up(db: DatabaseSync): void {
  // Enable FK enforcement for this connection before any DDL runs
  db.exec('PRAGMA foreign_keys = ON');

  // Safety net: create members table for fresh DBs that have not yet had the
  // inline DDL in db.ts run (e.g. an in-memory DB used in tests).
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

  db.exec(`
    CREATE TABLE workspaces (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      slug  TEXT NOT NULL UNIQUE,
      name  TEXT NOT NULL,
      bamboohr_dept_code_list TEXT NOT NULL DEFAULT '',
      okta_group TEXT NOT NULL DEFAULT ''
    )
  `);

  // Four workspace rows: parent company + three subsidiaries
  const parentDeptCodes = JSON.stringify([
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Legal',
    'Operations',
  ]);

  const insertWorkspace = db.prepare(
    'INSERT INTO workspaces (slug, name, bamboohr_dept_code_list, okta_group) VALUES (?, ?, ?, ?)'
  );
  insertWorkspace.run('parent',               'Parent Co',          parentDeptCodes, 'tb-workspace-parent');
  insertWorkspace.run('brightline',            'Brightline',         '',              'tb-workspace-brightline');
  insertWorkspace.run('northstar-logistics',   'Northstar Logistics', '',             'tb-workspace-northstar-logistics');
  insertWorkspace.run('helio-studios',         'Helio Studios',      '',              'tb-workspace-helio-studios');

  // Add workspace_id to existing members; default 1 = Parent Co (backfill)
  db.exec(`
    ALTER TABLE members
      ADD COLUMN workspace_id INTEGER NOT NULL DEFAULT 1 REFERENCES workspaces(id)
  `);

  db.exec('UPDATE members SET workspace_id = 1');

  db.exec(`
    CREATE TABLE departments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
      code         TEXT NOT NULL,
      name         TEXT NOT NULL,
      UNIQUE(workspace_id, code)
    )
  `);

  // Canonical 9 department rows for the Parent Co workspace (id = 1)
  const insertDept = db.prepare(
    'INSERT INTO departments (workspace_id, code, name) VALUES (?, ?, ?)'
  );
  insertDept.run(1, 'Engineering',     'Engineering');
  insertDept.run(1, 'Product',         'Product');
  insertDept.run(1, 'Design',          'Design');
  insertDept.run(1, 'Marketing',       'Marketing');
  insertDept.run(1, 'Sales',           'Sales');
  insertDept.run(1, 'Human Resources', 'Human Resources');
  insertDept.run(1, 'Finance',         'Finance');
  insertDept.run(1, 'Legal',           'Legal');
  insertDept.run(1, 'Operations',      'Operations');

  db.exec(`
    CREATE TABLE audit_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email  TEXT NOT NULL,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
      action       TEXT NOT NULL,
      entity_id    INTEGER,
      at           TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export function down(db: DatabaseSync): void {
  db.exec('DROP TABLE IF EXISTS audit_log');
  db.exec('DROP TABLE IF EXISTS departments');
  db.exec('ALTER TABLE members DROP COLUMN workspace_id');
  db.exec('DROP TABLE IF EXISTS workspaces');
}

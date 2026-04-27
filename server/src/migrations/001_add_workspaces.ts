import { DatabaseSync } from 'node:sqlite';

export function up(db: DatabaseSync): void {
  const migrate = db.transaction(() => {
    // 1. Create workspaces table
    db.exec(`
      CREATE TABLE workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        bamboohr_dept_code_list TEXT,
        bamboohr_api_key TEXT,
        okta_group TEXT
      )
    `);

    // 2. Insert parent-co row and capture its id
    const insertWorkspace = db.prepare(
      `INSERT INTO workspaces (slug, name) VALUES (?, ?)`
    );
    const wsResult = insertWorkspace.run('parent-co', 'Parent Co');
    const parentCoId = Number(wsResult.lastInsertRowid);

    // 3. Create departments table
    db.exec(`
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        name TEXT NOT NULL
      )
    `);

    // Insert 9 canonical departments for parent-co
    const insertDept = db.prepare(
      `INSERT INTO departments (workspace_id, name) VALUES (?, ?)`
    );
    const canonicalDepts = [
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'HR',
      'Finance',
      'Legal',
      'Operations',
    ];
    for (const dept of canonicalDepts) {
      insertDept.run(parentCoId, dept);
    }

    // 4. Create members_new with workspace_id and UNIQUE(email, workspace_id)
    db.exec(`
      CREATE TABLE members_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        start_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(email, workspace_id)
      )
    `);

    // 5. INSERT SELECT from old members, assigning parent-co workspace id
    const backfill = db.prepare(`
      INSERT INTO members_new (id, workspace_id, name, email, role, department, start_date, is_active, created_at, updated_at)
      SELECT id, ?, name, email, role, department, start_date, is_active, created_at, updated_at
      FROM members
    `);
    backfill.run(parentCoId);

    // 6. Drop the old members table
    db.exec(`DROP TABLE members`);

    // 7. Rename members_new → members
    db.exec(`ALTER TABLE members_new RENAME TO members`);

    // 8. Create audit_log table
    db.exec(`
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_email TEXT NOT NULL,
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
        action TEXT NOT NULL,
        entity_id TEXT,
        at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // 9. Fix dept name typos carried over from old seed data
    db.exec(`UPDATE members SET department = 'Engineering' WHERE department = 'Eng'`);
    db.exec(`UPDATE members SET department = 'HR' WHERE department = 'Human Resources'`);
  });

  migrate();
}

export function down(db: DatabaseSync): void {
  const rollback = db.transaction(() => {
    db.exec(`PRAGMA foreign_keys = OFF`);

    // Recreate members with original schema (no workspace_id, unique on email)
    db.exec(`
      CREATE TABLE members_old (
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

    // Copy data back without workspace_id
    db.exec(`
      INSERT INTO members_old (id, name, email, role, department, start_date, is_active, created_at, updated_at)
      SELECT id, name, email, role, department, start_date, is_active, created_at, updated_at
      FROM members
    `);

    // Swap tables
    db.exec(`DROP TABLE members`);
    db.exec(`ALTER TABLE members_old RENAME TO members`);

    // Drop migration-added tables (child tables before parent)
    db.exec(`DROP TABLE IF EXISTS audit_log`);
    db.exec(`DROP TABLE IF EXISTS departments`);
    db.exec(`DROP TABLE IF EXISTS workspaces`);

    db.exec(`PRAGMA foreign_keys = ON`);
  });

  rollback();
}

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY
    )
  `);

  const hasRun = db.prepare(`SELECT 1 FROM _migrations WHERE name = ?`).get('001_add_workspaces');
  if (!hasRun) {
    up(db);
    db.prepare(`INSERT OR IGNORE INTO _migrations (name) VALUES (?)`).run('001_add_workspaces');
  }
}

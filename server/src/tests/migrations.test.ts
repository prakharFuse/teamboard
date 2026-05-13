import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { up as up001, down as down001 } from '../migrations/001_add_workspaces.js';
import { up as up002, down as down002 } from '../migrations/002_add_feature_flags.js';

// Helper: returns true if the named table exists in the database.
function tableExists(db: DatabaseSync, tableName: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(tableName) as unknown as { name: string } | undefined;
  return row !== undefined;
}

// Helper: returns true if the named column exists on the given table.
// Uses PRAGMA table_info which returns zero rows for a non-existent table,
// so this safely returns false in that case as well.
function columnExists(db: DatabaseSync, tableName: string, columnName: string): boolean {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as unknown as { name: string }[];
  return columns.some((col) => col.name === columnName);
}

test('migration 001: up() creates workspaces, departments, audit_log and adds workspace_id to members; down() reverses all changes', () => {
  const db = new DatabaseSync(':memory:');

  // Simulate pre-migration legacy state: only the original members table.
  db.exec(`
    CREATE TABLE members (
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

  // Pre-conditions: members exists, new tables/column are absent.
  assert.ok(tableExists(db, 'members'),    'members table must exist before migration');
  assert.ok(!tableExists(db, 'workspaces'), 'workspaces must not exist before migration');
  assert.ok(!tableExists(db, 'departments'), 'departments must not exist before migration');
  assert.ok(!tableExists(db, 'audit_log'), 'audit_log must not exist before migration');
  assert.ok(
    !columnExists(db, 'members', 'workspace_id'),
    'members.workspace_id must not exist before migration',
  );

  // ── up() ────────────────────────────────────────────────────────────────────
  up001(db);

  // New tables must exist.
  assert.ok(tableExists(db, 'workspaces'),  'workspaces must exist after up()');
  assert.ok(tableExists(db, 'departments'), 'departments must exist after up()');
  assert.ok(tableExists(db, 'audit_log'),   'audit_log must exist after up()');

  // members must have gained workspace_id.
  assert.ok(
    columnExists(db, 'members', 'workspace_id'),
    'members.workspace_id must exist after up()',
  );

  // ── down() ──────────────────────────────────────────────────────────────────
  down001(db);

  // New tables must be gone.
  assert.ok(!tableExists(db, 'audit_log'),   'audit_log must not exist after down()');
  assert.ok(!tableExists(db, 'departments'), 'departments must not exist after down()');
  assert.ok(!tableExists(db, 'workspaces'),  'workspaces must not exist after down()');

  // workspace_id column must be removed, but members itself survives.
  assert.ok(
    !columnExists(db, 'members', 'workspace_id'),
    'members.workspace_id must not exist after down()',
  );
  assert.ok(tableExists(db, 'members'), 'members table must still exist after down()');
});

test('migration 002: up() creates feature_flags with default row; down() drops it', () => {
  const db = new DatabaseSync(':memory:');

  // Pre-condition: feature_flags does not exist.
  assert.ok(!tableExists(db, 'feature_flags'), 'feature_flags must not exist before migration');

  // ── up() ────────────────────────────────────────────────────────────────────
  up002(db);

  assert.ok(tableExists(db, 'feature_flags'), 'feature_flags must exist after up()');

  // The seed row for workspace_switcher_enabled must be present and default to 'false'.
  const row = db
    .prepare("SELECT value FROM feature_flags WHERE key = 'workspace_switcher_enabled'")
    .get() as unknown as { value: string } | undefined;
  assert.ok(row !== undefined, 'workspace_switcher_enabled row must exist after up()');
  assert.strictEqual(row?.value, 'false', 'workspace_switcher_enabled must default to false');

  // ── down() ──────────────────────────────────────────────────────────────────
  down002(db);

  assert.ok(!tableExists(db, 'feature_flags'), 'feature_flags must not exist after down()');
});

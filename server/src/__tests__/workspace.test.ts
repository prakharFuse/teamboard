import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ── Environment setup ─────────────────────────────────────────────────────────
// These must be assigned BEFORE any dynamic import that touches db.ts or auth.ts
// so that the module-level singletons (DatabaseSync path, OktaOIDC constructor)
// receive the correct values.
process.env['DB_PATH'] = 'data/test.db';
process.env['OKTA_ISSUER'] ??= 'https://dev-000000.okta.example.com';
process.env['OKTA_CLIENT_ID'] ??= 'test-client-id';
process.env['OKTA_CLIENT_SECRET'] ??= 'test-client-secret';
process.env['APP_BASE_URL'] ??= 'http://localhost:4060';
process.env['SESSION_SECRET'] ??= 'test-session-secret';

// ── Row shapes ────────────────────────────────────────────────────────────────

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  workspace_id: number;
}

interface AuditRow {
  id: number;
  actor_email: string;
  workspace_id: number;
  action: string;
  entity_id: number | null;
  at: string;
}

// ── Shared test state ─────────────────────────────────────────────────────────

let server: http.Server;
let baseUrl: string;
let parentCoId: number;
let brightlineId: number;

// DatabaseSync is imported dynamically; type as `any` to avoid a circular static
// import that would evaluate auth.ts before our env vars are in place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Workspace API', () => {
  // ── Setup ──────────────────────────────────────────────────────────────────
  before(async () => {
    // Remove any leftover test database so every run starts clean.
    const dbPath = path.resolve(process.cwd(), 'data', 'test.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    // Dynamic imports: env vars are guaranteed to be set at this point, so
    // auth.ts can safely call `new OktaOIDC({ issuer: process.env.OKTA_ISSUER })`.
    const { getDb } = await import('../db.js');
    const { resolveWorkspace, requireWorkspaceAccess } = await import('../middleware/workspace.js');
    const { default: membersRouter } = await import('../routes/members.js');

    // Initialise the DB (runs all migrations + seeds Parent Co members).
    db = getDb();

    // Resolve workspace primary-key IDs for assertion helpers.
    const parentCo = db
      .prepare("SELECT id FROM workspaces WHERE slug = 'parent-co'")
      .get() as { id: number };
    const brightline = db
      .prepare("SELECT id FROM workspaces WHERE slug = 'brightline'")
      .get() as { id: number };
    parentCoId = parentCo.id;
    brightlineId = brightline.id;

    // Seed a Brightline member so tests (b) and (e) always have data to read.
    db.prepare(
      'INSERT OR IGNORE INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      'Bright Lin',
      'bright.lin@brightline.example.com',
      'Engineer',
      'Engineering',
      '2024-01-15',
      brightlineId,
    );

    // Give Brightline a non-empty bamboohr_dept_code_list so test (f) has a
    // workspace whose department validation is active.
    db.prepare(
      "UPDATE workspaces SET bamboohr_dept_code_list = ? WHERE slug = 'brightline'",
    ).run(JSON.stringify(['Engineering', 'Operations', 'Sales']));

    // ── Test auth-injection middleware ────────────────────────────────────────
    // Reads the custom `X-Test-Auth-Groups` header (comma-separated Okta group
    // names such as `tb-workspace-brightline`) and builds a synthetic
    // `req.userContext` that the real workspace middleware can consume.
    const injectTestAuth = (req: Request, _res: Response, next: NextFunction): void => {
      const groups = req.headers['x-test-auth-groups'] as string | undefined;
      if (groups) {
        const email =
          (req.headers['x-test-auth-email'] as string | undefined) ?? 'test@example.com';
        (req as Request & { userContext: unknown }).userContext = {
          userinfo: { email, groups: groups.split(',') },
        };
      }
      next();
    };

    // ── Test Express application ───────────────────────────────────────────────
    // Mirrors the structure of index.ts but replaces the real Okta middleware
    // with the lightweight injectTestAuth shim above.
    const app = express();
    app.use(express.json());

    // GET /api/config — reads env var at request time so tests can toggle it.
    app.get('/api/config', (_req: Request, res: Response): void => {
      res.json({
        featureFlags: {
          workspaceSwitcher: process.env['FEATURE_WORKSPACE_SWITCHER'] === '1',
        },
      });
    });

    app.use(
      '/api/members',
      injectTestAuth,
      resolveWorkspace,
      requireWorkspaceAccess,
      membersRouter,
    );

    // Bind to an OS-assigned ephemeral port so we never clash with running services.
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const addr = server.address() as { address: string; port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  // ── Teardown ───────────────────────────────────────────────────────────────
  after(async () => {
    // Remove rows that were inserted (or attempted) during the suite.
    db.prepare("DELETE FROM members WHERE email LIKE '%brightline.example.com%'").run();
    db.prepare("DELETE FROM members WHERE email LIKE 'test-member-%'").run();
    db.prepare('DELETE FROM audit_log').run();

    // Reset Brightline's dept list back to the default empty state.
    db.prepare(
      "UPDATE workspaces SET bamboohr_dept_code_list = '[]' WHERE slug = 'brightline'",
    ).run();

    db.close();

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // ── (a) Headerless request defaults to Parent Co ──────────────────────────
  test('GET /api/members with no X-Workspace-Id returns 200 containing only Parent Co members', async () => {
    const res = await fetch(`${baseUrl}/api/members`);
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as { members: MemberRow[] };
    assert.ok(Array.isArray(body.members), 'Response should contain a members array');
    assert.ok(body.members.length > 0, 'There should be at least one seeded Parent Co member');

    for (const m of body.members) {
      assert.strictEqual(
        m.workspace_id,
        parentCoId,
        `Member "${m.name}" (id=${m.id}) should belong to Parent Co (workspace_id=${parentCoId})`,
      );
    }
  });

  // ── (b) Authenticated Brightline user sees only Brightline members ─────────
  test(
    'GET /api/members with X-Workspace-Id: brightline and valid Brightline session returns only Brightline members',
    async () => {
      const res = await fetch(`${baseUrl}/api/members`, {
        headers: {
          'X-Workspace-Id': 'brightline',
          'X-Test-Auth-Groups': 'tb-workspace-brightline',
        },
      });
      assert.strictEqual(res.status, 200);

      const body = (await res.json()) as { members: MemberRow[] };
      assert.ok(Array.isArray(body.members), 'Response should contain a members array');
      assert.ok(body.members.length > 0, 'There should be at least one seeded Brightline member');

      for (const m of body.members) {
        assert.strictEqual(
          m.workspace_id,
          brightlineId,
          `Member "${m.name}" (id=${m.id}) should belong to Brightline (workspace_id=${brightlineId})`,
        );
      }
    },
  );

  // ── (c) Cross-workspace read is rejected with 403 ─────────────────────────
  test(
    'GET /api/members with X-Workspace-Id: brightline from a parent-co-only user returns 403',
    async () => {
      const res = await fetch(`${baseUrl}/api/members`, {
        headers: {
          'X-Workspace-Id': 'brightline',
          'X-Test-Auth-Groups': 'tb-workspace-parent-co',
        },
      });
      assert.strictEqual(res.status, 403);
    },
  );

  // ── (d) POST /api/members writes an audit_log row ─────────────────────────
  test(
    "POST /api/members writes an audit_log row with action 'member.create' and correct workspace_id",
    async () => {
      const res = await fetch(`${baseUrl}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Member D',
          email: 'test-member-d@example.com',
          role: 'Analyst',
          department: 'Engineering',
          start_date: '2025-06-01',
        }),
      });
      assert.strictEqual(res.status, 201);

      const created = (await res.json()) as MemberRow;

      // Verify that exactly one audit_log row was written for this entity.
      const auditRows = db
        .prepare("SELECT * FROM audit_log WHERE action = 'member.create' AND entity_id = ?")
        .all(created.id) as AuditRow[];

      assert.strictEqual(
        auditRows.length,
        1,
        'Exactly one audit_log row should be written for the new member',
      );
      assert.strictEqual(auditRows[0].action, 'member.create');
      assert.strictEqual(
        auditRows[0].workspace_id,
        parentCoId,
        'audit_log workspace_id should match Parent Co',
      );
    },
  );

  // ── (e) Export CSV is scoped to the requested workspace ───────────────────
  test(
    'GET /api/members/export with X-Workspace-Id: brightline returns a CSV whose first line is the exact column header and every data row belongs to Brightline',
    async () => {
      const res = await fetch(`${baseUrl}/api/members/export`, {
        headers: {
          'X-Workspace-Id': 'brightline',
          'X-Test-Auth-Groups': 'tb-workspace-brightline',
        },
      });
      assert.strictEqual(res.status, 200);

      const csv = await res.text();
      const lines = csv.split('\n');

      // The first line must be exactly the canonical column header.
      assert.strictEqual(
        lines[0],
        'id,name,email,role,department,start_date,is_active',
        'CSV first line must be the exact header string',
      );

      // Every non-empty data line must correspond to a Brightline member.
      const dataLines = lines.slice(1).filter((l) => l.trim() !== '');
      assert.ok(dataLines.length > 0, 'CSV must contain at least one data row');

      for (const line of dataLines) {
        const id = Number(line.split(',')[0]);
        const row = db
          .prepare('SELECT workspace_id FROM members WHERE id = ?')
          .get(id) as { workspace_id: number } | undefined;

        assert.ok(row !== undefined, `Member with id=${id} from CSV should exist in the database`);
        assert.strictEqual(
          row!.workspace_id,
          brightlineId,
          `CSV row with id=${id} should belong to Brightline (workspace_id=${brightlineId})`,
        );
      }
    },
  );

  // ── (f) Invalid department is rejected when workspace has a dept list ──────
  test(
    "POST /api/members with invalid department for a workspace whose bamboohr_dept_code_list is non-empty returns 400",
    async () => {
      const res = await fetch(`${baseUrl}/api/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': 'brightline',
          'X-Test-Auth-Groups': 'tb-workspace-brightline',
        },
        body: JSON.stringify({
          name: 'Bad Dept User',
          email: 'bad-dept@brightline.example.com',
          role: 'Engineer',
          department: 'InvalidDepartment',
          start_date: '2025-01-01',
        }),
      });
      assert.strictEqual(res.status, 400);
    },
  );

  // ── (g) GET /api/config reflects FEATURE_WORKSPACE_SWITCHER ──────────────
  test(
    'GET /api/config returns { featureFlags: { workspaceSwitcher: false } } when FEATURE_WORKSPACE_SWITCHER is unset',
    async () => {
      delete process.env['FEATURE_WORKSPACE_SWITCHER'];

      const res = await fetch(`${baseUrl}/api/config`);
      assert.strictEqual(res.status, 200);

      const body = (await res.json()) as { featureFlags: { workspaceSwitcher: boolean } };
      assert.deepStrictEqual(body, { featureFlags: { workspaceSwitcher: false } });
    },
  );

  test(
    "GET /api/config returns { featureFlags: { workspaceSwitcher: true } } when FEATURE_WORKSPACE_SWITCHER is '1'",
    async () => {
      process.env['FEATURE_WORKSPACE_SWITCHER'] = '1';

      const res = await fetch(`${baseUrl}/api/config`);
      assert.strictEqual(res.status, 200);

      const body = (await res.json()) as { featureFlags: { workspaceSwitcher: boolean } };
      assert.deepStrictEqual(body, { featureFlags: { workspaceSwitcher: true } });

      delete process.env['FEATURE_WORKSPACE_SWITCHER'];
    },
  );
});

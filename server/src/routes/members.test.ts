/**
 * Members API contract tests (run by CI via `pnpm test`).
 *
 * These are written test-first against TeamBoard's department rules: the
 * "rejects an invalid department" case is RED on `main` today because
 * `POST /api/members` performs no department validation (see members.ts —
 * it inserts whatever `department` string the caller sends). That failing
 * check is intentional: it gives a PR a real, readable failing CI run so the
 * Fix-CI / Refine-PR flow has a genuine `pr_check` to pick up.
 *
 * Resolving TM-105 (department validation) should make the red test pass.
 *
 * No test framework dependency — Node's built-in test runner + an ephemeral
 * in-process Express server on an in-memory SQLite DB.
 */
import { test, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import membersRouter, { ssoDeprovision } from './members.js';

// Isolated throwaway DB — must be set before the first getDb() call (handlers
// call getDb() lazily, so setting it here, before any request, is enough).
process.env.TEAMBOARD_DB_PATH = ':memory:';

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/members', membersRouter);
  return app;
}

const app = makeApp();

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } finally {
    server.close();
  }
}

async function callCsv(path: string): Promise<string> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return await res.text();
  } finally {
    server.close();
  }
}

let firstRunReady = false;
before(() => {
  // Touch the DB once so the seed rows exist before the first assertion.
  firstRunReady = true;
});

test('GET /api/members lists the seeded active members', async () => {
  assert.ok(firstRunReady);
  const res = await call('GET', '/api/members');
  assert.equal(res.status, 200);
  const members = (res.json as { members: unknown[] }).members;
  assert.ok(Array.isArray(members), 'response has a members array');
  assert.ok(members.length > 0, 'seed data is present');
});

test('POST /api/members rejects an invalid department with 400', async () => {
  // RED until TM-105 lands department validation. The API currently accepts
  // any department string and returns 201, so this assertion fails on main.
  const res = await call('POST', '/api/members', {
    name: 'Test Person',
    email: `ci-test-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'NotARealDepartment',
    start_date: '2024-01-01',
  });
  assert.equal(
    res.status,
    400,
    `invalid department must be rejected with 400 (got ${res.status}: ${JSON.stringify(res.json)})`,
  );
});

test('PATCH /api/members/:id rejects an invalid department with 400 and leaves department unchanged', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Patch Reject Test',
    email: `patch-reject-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const patchRes = await call('PATCH', `/api/members/${id}`, {
    department: 'NotARealDepartment',
  });
  assert.equal(
    patchRes.status,
    400,
    `invalid department must be rejected with 400 (got ${patchRes.status}: ${JSON.stringify(patchRes.json)})`,
  );

  const getRes = await call('GET', `/api/members/${id}`);
  assert.equal(getRes.status, 200);
  assert.equal(
    (getRes.json as { department: string }).department,
    'Engineering',
    'department must remain the seeded value after a rejected PATCH',
  );
});

test('PATCH /api/members/:id accepts a valid canonical department and updates it', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Patch Accept Test',
    email: `patch-accept-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const patchRes = await call('PATCH', `/api/members/${id}`, {
    department: 'Design',
  });
  assert.equal(patchRes.status, 200);
  assert.equal((patchRes.json as { department: string }).department, 'Design');

  const getRes = await call('GET', `/api/members/${id}`);
  assert.equal(getRes.status, 200);
  assert.equal((getRes.json as { department: string }).department, 'Design');
});

test('DELETE /api/members/:id soft-deletes: marks inactive, prefixes email once, and drops the member from listings and stats', async () => {
  const originalEmail = `soft-delete-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'Soft Delete Test',
    email: originalEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const statsBefore = await call('GET', '/api/members/stats');
  assert.equal(statsBefore.status, 200);
  const totalBefore = (statsBefore.json as { total: number }).total;

  const deleteRes = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleteRes.status, 200);

  const getRes = await call('GET', `/api/members/${id}`);
  assert.equal(getRes.status, 200);
  const member = getRes.json as { is_active: number; email: string };
  assert.equal(member.is_active, 0);
  assert.equal(member.email, `deactivated-${originalEmail}`);

  const listRes = await call('GET', '/api/members');
  assert.equal(listRes.status, 200);
  const listedIds = (listRes.json as { members: { id: number }[] }).members.map(m => m.id);
  assert.ok(!listedIds.includes(id), 'deactivated member must not appear in GET /');

  const statsAfter = await call('GET', '/api/members/stats');
  assert.equal(statsAfter.status, 200);
  assert.equal(
    (statsAfter.json as { total: number }).total,
    totalBefore - 1,
    'deactivated member must be excluded from GET /stats total',
  );
});

test('GET /api/members/export still includes a soft-deleted member with its deactivated- email', async () => {
  const originalEmail = `export-soft-delete-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'Export Soft Delete Test',
    email: originalEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleteRes = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleteRes.status, 200);

  const csv = await callCsv('/api/members/export');
  const expectedRow = `${id},Export Soft Delete Test,deactivated-${originalEmail},Engineer,Engineering,2024-01-01,0`;
  const rows = csv.split('\n');
  assert.ok(
    rows.includes(expectedRow),
    `export must still include the deactivated member's row (expected "${expectedRow}", got:\n${csv})`,
  );
});

test('DELETE /api/members/:id is idempotent: a second delete does not double-prefix the email or error', async () => {
  const originalEmail = `idempotent-delete-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'Idempotent Delete Test',
    email: originalEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const firstDelete = await call('DELETE', `/api/members/${id}`);
  assert.equal(firstDelete.status, 200);

  const secondDelete = await call('DELETE', `/api/members/${id}`);
  assert.equal(
    secondDelete.status,
    200,
    `second delete must succeed rather than error (got ${secondDelete.status}: ${JSON.stringify(secondDelete.json)})`,
  );

  const getRes = await call('GET', `/api/members/${id}`);
  assert.equal(getRes.status, 200);
  const member = getRes.json as { is_active: number; email: string };
  assert.equal(
    member.email,
    `deactivated-${originalEmail}`,
    'email must carry exactly one deactivated- prefix, not a double prefix',
  );
  assert.equal(member.is_active, 0);
});

test('DELETE /api/members/:id dispatches SSO deprovision synchronously with only the member id', async () => {
  const originalEmail = `sso-dispatch-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'SSO Dispatch Test',
    email: originalEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const dispatchSpy = mock.method(ssoDeprovision, 'dispatch', () => {});
  try {
    const deleteRes = await call('DELETE', `/api/members/${id}`);
    assert.equal(deleteRes.status, 200);

    assert.equal(
      dispatchSpy.mock.callCount(),
      1,
      'SSO deprovision must fire exactly once, synchronously, from the delete request',
    );
    const call0 = dispatchSpy.mock.calls[0];
    assert.deepEqual(
      call0.arguments,
      [id],
      'SSO deprovision must receive only the member id, never the raw email or a secret',
    );
  } finally {
    dispatchSpy.mock.restore();
  }
});

test('GET /api/members/export locks the BambooHR column order and only emits canonical departments', async () => {
  const CANONICAL_DEPARTMENTS = [
    'Engineering', 'Product', 'Design', 'Marketing',
    'Sales', 'Operations', 'Finance', 'HR', 'Legal',
  ];

  const csv = await callCsv('/api/members/export');
  const rows = csv.split('\n').filter(row => row.length > 0);
  assert.equal(
    rows[0],
    'id,name,email,role,department,start_date,is_active',
    'export header must match BambooHR\'s expected position-based column order exactly',
  );

  const dataRows = rows.slice(1);
  assert.ok(dataRows.length > 0, 'seed data must produce at least one export row');
  for (const row of dataRows) {
    const department = row.split(',')[4];
    assert.ok(
      CANONICAL_DEPARTMENTS.includes(department),
      `export row has a non-canonical department "${department}" (row: "${row}")`,
    );
  }
});

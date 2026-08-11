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
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import membersRouter from './members.js';

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

async function callText(
  method: string,
  path: string,
): Promise<{ status: number; text: string }> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { method });
    const text = await res.text();
    return { status: res.status, text };
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

test('DELETE /api/members/:id soft-deletes: removed from the active directory', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Soft Delete Person',
    email: `soft-delete-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleted = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.json, { success: true });

  const list = await call('GET', '/api/members');
  const members = (list.json as { members: { id: number }[] }).members;
  assert.ok(
    !members.some(m => m.id === id),
    'deleted member must not appear in the active directory',
  );
});

test('DELETE /api/members/:id retains the record instead of erasing it', async () => {
  const original = {
    name: 'Retained Person',
    email: `retained-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  };
  const created = await call('POST', '/api/members', original);
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  await call('DELETE', `/api/members/${id}`);

  const fetched = await call('GET', `/api/members/${id}`);
  assert.equal(fetched.status, 200);
  const member = fetched.json as {
    is_active: number;
    name: string;
    role: string;
    department: string;
    start_date: string;
  };
  assert.equal(member.is_active, 0);
  assert.equal(member.name, original.name);
  assert.equal(member.role, original.role);
  assert.equal(member.department, original.department);
  assert.equal(member.start_date, original.start_date);
});

test('GET /api/members/export still lists a deactivated member with is_active = 0', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Export Person',
    email: `export-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleted = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleted.status, 200);

  const exported = await callText('GET', '/api/members/export');
  assert.equal(exported.status, 200);
  const rows = exported.text.split('\n');
  const row = rows.find(r => r.startsWith(`${id},`));
  assert.ok(row, `export must include a row for member id ${id}`);
  const columns = (row as string).split(',');
  assert.equal(columns[columns.length - 1], '0');
});

test('DELETE /api/members/:id prefixes the email with deactivated- for Okta SSO revocation', async () => {
  const baseEmail = `okta-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'Okta Person',
    email: baseEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  await call('DELETE', `/api/members/${id}`);

  const fetched = await call('GET', `/api/members/${id}`);
  assert.equal(fetched.status, 200);
  const member = fetched.json as { email: string };
  assert.equal(member.email, `deactivated-${baseEmail}`);
});

test('DELETE /api/members/:id is idempotent: a second delete does not double-prefix the email', async () => {
  const baseEmail = `okta-idempotent-${Date.now()}@company.com`;
  const created = await call('POST', '/api/members', {
    name: 'Okta Idempotent Person',
    email: baseEmail,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  await call('DELETE', `/api/members/${id}`);
  const secondDelete = await call('DELETE', `/api/members/${id}`);
  assert.equal(secondDelete.status, 200);
  assert.deepEqual(secondDelete.json, { success: true });

  const fetched = await call('GET', `/api/members/${id}`);
  assert.equal(fetched.status, 200);
  const member = fetched.json as { email: string };
  assert.equal(member.email, `deactivated-${baseEmail}`);
});

test('DELETE /api/members/:id returns 404 for a nonexistent member', async () => {
  const res = await call('DELETE', '/api/members/999999');
  assert.equal(res.status, 404);
  assert.deepEqual(res.json, { error: 'Member not found' });
});

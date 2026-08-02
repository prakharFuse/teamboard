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
    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('Server not listening');
    const { port } = addr;
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

async function callForText(
  method: string,
  path: string,
): Promise<{ status: number; text: string }> {
  const server = app.listen(0);
  try {
    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('Server not listening');
    const { port } = addr;
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

test('POST /api/members accepts a valid department code', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Valid Dept Person',
    email: `ci-test-valid-dept-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 201);
  assert.equal((res.json as { department: string }).department, 'ENGR');
});

test('PATCH /api/members/:id rejects an invalid department code', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Patch Dept Person',
    email: `ci-test-patch-dept-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;
  const res = await call('PATCH', `/api/members/${id}`, { department: 'NOPE' });
  assert.equal(res.status, 400);
});

test('GET /api/members/export includes a dept_code column', async () => {
  const res = await callForText('GET', '/api/members/export');
  const [header] = res.text.split('\n');
  assert.equal(header, 'id,name,email,role,dept_code,start_date,is_active');
});

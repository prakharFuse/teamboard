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

async function callRaw(
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

test('POST /api/members accepts a valid department code', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Engr Person',
    email: `ci-test-engr-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 201);
  const member = res.json as { department: string };
  assert.equal(member.department, 'ENGR');
});

test('POST /api/members error message enumerates allowed codes', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Bogus Person',
    email: `ci-test-bogus-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'BOGUS',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 400);
  const errorMsg = (res.json as { error: string }).error;
  assert.ok(
    errorMsg.includes('ENGR'),
    `error message should include 'ENGR', got: ${errorMsg}`,
  );
  assert.ok(
    errorMsg.includes('LEGL'),
    `error message should include 'LEGL', got: ${errorMsg}`,
  );
});

test('PATCH /api/members/:id rejects invalid department', async () => {
  // First POST a valid member with department 'PROD' to get a real id.
  const postRes = await call('POST', '/api/members', {
    name: 'Prod Person',
    email: `ci-test-prod-${Date.now()}@company.com`,
    role: 'Product Manager',
    department: 'PROD',
    start_date: '2024-01-01',
  });
  assert.equal(postRes.status, 201);
  const { id } = postRes.json as { id: number };

  // Then PATCH that member with an invalid department code.
  const patchRes = await call('PATCH', `/api/members/${id}`, {
    department: 'NOPE',
  });
  assert.equal(patchRes.status, 400);
});

test('GET /api/members/export emits dept_code and dept_name columns', async () => {
  const res = await callRaw('GET', '/api/members/export');
  assert.equal(res.status, 200);
  const firstLine = res.text.split('\n')[0];
  assert.equal(firstLine, 'id,name,email,role,dept_code,dept_name,start_date,is_active');
});

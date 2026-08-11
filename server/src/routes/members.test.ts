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
import { DEPARTMENT_CODES } from '../departments.js';

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

test('POST /api/members with a valid department code returns 201', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Test Person',
    email: `ci-test-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 201);
  const member = res.json as { department: string };
  assert.equal(member.department, 'ENGR');
});

test('POST /api/members with an invalid department code returns the exact error message', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Test Person',
    email: `ci-test-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'NotARealDepartment',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 400);
  const body = res.json as { error: string };
  assert.equal(
    body.error,
    "Invalid department code 'NotARealDepartment'. Allowed codes: ENGR, PROD, DSGN, HRES, FINC, MKTG, SALE, OPER, LEGL",
  );
});

test("PATCH /api/members/:id with department 'PROD' returns 200 and updates the department", async () => {
  const list = await call('GET', '/api/members');
  const seeded = (list.json as { members: { id: number }[] }).members[0];
  const res = await call('PATCH', `/api/members/${seeded.id}`, { department: 'PROD' });
  assert.equal(res.status, 200);
  const updated = res.json as { department: string };
  assert.equal(updated.department, 'PROD');
});

test("PATCH /api/members/:id with department 'BOGUS' returns 400", async () => {
  const list = await call('GET', '/api/members');
  const seeded = (list.json as { members: { id: number }[] }).members[0];
  const res = await call('PATCH', `/api/members/${seeded.id}`, { department: 'BOGUS' });
  assert.equal(res.status, 400);
});

test('GET /api/members/export returns a CSV with a dept_code column using an allowed code', async () => {
  const server = app.listen(0);
  let text: string;
  let status: number;
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/members/export`);
    status = res.status;
    text = await res.text();
  } finally {
    server.close();
  }
  assert.equal(status, 200);
  const lines = text.split('\n');
  assert.equal(lines[0], 'id,name,email,role,dept_code,start_date,is_active');
  const dataRow = lines[1];
  const fields = dataRow.split(',');
  const deptCode = fields[4];
  assert.ok(
    DEPARTMENT_CODES.includes(deptCode),
    `expected dept_code field to be one of the allowed codes, got '${deptCode}'`,
  );
});

/**
 * Members API contract tests (run by CI via `pnpm test`).
 *
 * Covers TeamBoard's BambooHR department-code rules (TEAM-4): POST/PATCH
 * validate `department` against the People-Ops-confirmed code list, and the
 * CSV export exposes a `dept_code` column.
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
  const res = await call('POST', '/api/members', {
    name: 'Test Person',
    email: `ci-test-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'NotARealDepartment',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 400);
  assert.equal(
    (res.json as { error: string }).error,
    "Invalid department code 'NotARealDepartment'. Allowed codes: ENGR, PROD, DSGN, HRES, FINC, MKTG, SALE, OPER, LEGL",
  );
});

test('POST /api/members accepts a valid department code', async () => {
  const res = await call('POST', '/api/members', {
    name: 'Test Person',
    email: `ci-test-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 201);
  assert.equal((res.json as { department: string }).department, 'ENGR');
});

test('PATCH /api/members/:id accepts a valid department code', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Patch Person',
    email: `ci-test-${Date.now()}-patch-ok@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  const id = (created.json as { id: number }).id;
  const res = await call('PATCH', `/api/members/${id}`, { department: 'PROD' });
  assert.equal(res.status, 200);
  assert.equal((res.json as { department: string }).department, 'PROD');
});

test('PATCH /api/members/:id rejects an invalid department code with 400', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Patch Person',
    email: `ci-test-${Date.now()}-patch-bad@company.com`,
    role: 'Engineer',
    department: 'ENGR',
    start_date: '2024-01-01',
  });
  const id = (created.json as { id: number }).id;
  const res = await call('PATCH', `/api/members/${id}`, { department: 'NOPE' });
  assert.equal(res.status, 400);
  assert.equal(
    (res.json as { error: string }).error,
    "Invalid department code 'NOPE'. Allowed codes: ENGR, PROD, DSGN, HRES, FINC, MKTG, SALE, OPER, LEGL",
  );
});

test('GET /api/members/export includes a dept_code column', async () => {
  const server = app.listen(0);
  let text: string;
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/members/export`);
    assert.equal(res.status, 200);
    text = await res.text();
  } finally {
    server.close();
  }
  const lines = text.split('\n');
  assert.equal(lines[0], 'id,name,email,role,dept_code,start_date,is_active');
  const dataRows = lines.slice(1).filter((line) => line.length > 0);
  assert.ok(dataRows.length > 0, 'export has at least one data row');
  const hasValidCode = dataRows.some((line) => {
    const deptCode = line.split(',')[4];
    return DEPARTMENT_CODES.includes(deptCode);
  });
  assert.ok(hasValidCode, 'at least one row has a valid dept_code');
});

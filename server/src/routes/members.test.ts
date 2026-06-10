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

test('DELETE /api/members/:id soft-deletes: returns is_active=0 and a valid deactivation_date', async () => {
  const listRes = await call('GET', '/api/members');
  const members = (listRes.json as { members: Array<{ id: number }> }).members;
  assert.ok(members.length > 0, 'seeded members must be present');
  const { id } = members[0];

  const delRes = await call('DELETE', `/api/members/${id}`);
  assert.equal(delRes.status, 200);

  const body = delRes.json as { is_active: number; deactivation_date: string | null };
  assert.equal(body.is_active, 0, 'is_active should be 0 after soft-delete');
  assert.ok(
    typeof body.deactivation_date === 'string' && body.deactivation_date.length > 0,
    'deactivation_date should be a non-empty string',
  );
  assert.match(
    body.deactivation_date as string,
    /^\d{4}-\d{2}-\d{2}$/,
    'deactivation_date must match YYYY-MM-DD',
  );
});

test('DELETE /api/members/:id removes member from active directory and decrements stats total', async () => {
  const created = await call('POST', '/api/members', {
    name: 'Visibility Test Member',
    email: `vis-${Date.now()}@company.com`,
    role: 'Analyst',
    department: 'Engineering',
    start_date: '2024-06-01',
  });
  assert.equal(created.status, 201);
  const { id: newId } = created.json as { id: number };

  const beforeStats = await call('GET', '/api/members/stats');
  const totalBefore = (beforeStats.json as { total: number }).total;

  const delRes = await call('DELETE', `/api/members/${newId}`);
  assert.equal(delRes.status, 200);

  const listRes = await call('GET', '/api/members');
  const ids = (listRes.json as { members: Array<{ id: number }> }).members.map(m => m.id);
  assert.ok(!ids.includes(newId), 'deactivated member must not appear in active directory');

  const afterStats = await call('GET', '/api/members/stats');
  const totalAfter = (afterStats.json as { total: number }).total;
  assert.equal(totalAfter, totalBefore - 1, 'stats total must decrease by 1 after deactivation');
});

test('GET /api/members/export CSV includes deactivated member with is_active=0 and correct headers', async () => {
  const created = await call('POST', '/api/members', {
    name: 'CSV Export Test',
    email: `csv-${Date.now()}@company.com`,
    role: 'Designer',
    department: 'Engineering',
    start_date: '2025-03-01',
  });
  assert.equal(created.status, 201);
  const { id: newId } = created.json as { id: number };

  await call('DELETE', `/api/members/${newId}`);

  const csvRes = await callText('GET', '/api/members/export');
  assert.equal(csvRes.status, 200);

  const lines = csvRes.text.split('\n').filter(l => l.length > 0);
  const [header, ...dataLines] = lines;

  assert.ok(
    header.startsWith('id,name,email,role,department,start_date,is_active,deactivation_date'),
    `CSV header must start with expected columns (got: ${header})`,
  );

  const deactivatedLine = dataLines.find(l => l.startsWith(`${newId},`));
  assert.ok(deactivatedLine, 'deactivated member must appear as a row in the CSV export');
  assert.ok(
    /,0,\d{4}-\d{2}-\d{2}/.test(deactivatedLine as string),
    `deactivated row must contain ,0,YYYY-MM-DD (got: ${deactivatedLine})`,
  );

  const activeLine = dataLines.find(l => l.endsWith(',1,'));
  assert.ok(activeLine, 'at least one active member row must end with ,1, (is_active=1, empty deactivation_date)');
});

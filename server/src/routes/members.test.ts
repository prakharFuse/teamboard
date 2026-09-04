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

test('DELETE /api/members/:id soft-deletes: row and data are preserved', async () => {
  const memberData = {
    name: 'Jamie Fakename',
    email: `soft-delete-${Date.now()}@example.test`,
    role: 'Tester',
    department: 'Engineering',
    start_date: '2023-05-01',
  };
  const created = await call('POST', '/api/members', memberData);
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleted = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.json, { success: true });

  const fetched = await call('GET', `/api/members/${id}`);
  assert.equal(fetched.status, 200);
  const member = fetched.json as {
    is_active: number;
    name: string;
    email: string;
    role: string;
    start_date: string;
  };
  assert.equal(member.is_active, 0);
  assert.equal(member.name, memberData.name);
  assert.equal(member.email, memberData.email);
  assert.equal(member.role, memberData.role);
  assert.equal(member.start_date, memberData.start_date);
});

test('DELETE /api/members/:id returns 404 for a non-existent id', async () => {
  const res = await call('DELETE', '/api/members/999999');
  assert.equal(res.status, 404);
});

test('GET /api/members excludes a soft-deleted member from the active directory', async () => {
  const memberData = {
    name: 'Robin Fakename',
    email: `soft-delete-directory-${Date.now()}@example.test`,
    role: 'Tester',
    department: 'Engineering',
    start_date: '2023-06-01',
  };
  const created = await call('POST', '/api/members', memberData);
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleted = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleted.status, 200);

  const res = await call('GET', '/api/members');
  assert.equal(res.status, 200);
  const members = (res.json as { members: { id: number }[] }).members;
  assert.ok(
    members.every((m) => m.id !== id),
    'soft-deleted member must not appear in the active directory',
  );
});

test('GET /api/members/export includes a soft-deleted member with is_active = 0', async () => {
  const memberData = {
    name: 'Casey Fakename',
    email: `soft-delete-export-${Date.now()}@example.test`,
    role: 'Tester',
    department: 'Engineering',
    start_date: '2023-07-01',
  };
  const created = await call('POST', '/api/members', memberData);
  assert.equal(created.status, 201);
  const id = (created.json as { id: number }).id;

  const deleted = await call('DELETE', `/api/members/${id}`);
  assert.equal(deleted.status, 200);

  const { status, text: csv } = await callText('GET', '/api/members/export');
  assert.equal(status, 200);

  const line = csv.split('\n').find((l) => l.includes(memberData.email));
  if (!line) throw new Error('exported CSV must contain the soft-deleted member');
  const fields = line.split(',');
  assert.equal(fields[fields.length - 1], '0');
});

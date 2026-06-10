/**
 * Members offboarding (DELETE) lifecycle regression tests.
 *
 * Three cases:
 *   1. Post-delete GET returns 404 — member is gone from the DB.
 *   2. DELETE on a non-existent ID returns 404.
 *   3. Repeat DELETE returns 404 with the same error shape (idempotent response).
 *
 * Mirrors members.test.ts setup exactly: in-memory SQLite, in-process Express,
 * no test framework dep beyond node:test.
 */
import { test } from 'node:test';
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

/** Create a fresh member and return their numeric id. */
async function createMember(suffix: string): Promise<number> {
  const res = await call('POST', '/api/members', {
    name: `Lifecycle Test ${suffix}`,
    email: `lifecycle-${suffix}-${Date.now()}@company.com`,
    role: 'Engineer',
    department: 'Engineering',
    start_date: '2024-01-01',
  });
  assert.equal(res.status, 201, `createMember: expected 201, got ${res.status}`);
  const body = res.json;
  if (typeof body !== 'object' || body === null || !('id' in body)) {
    throw new Error('unexpected shape');
  }
  return (body as { id: number }).id;
}

test('DELETE /api/members/:id — subsequent GET returns 404', async () => {
  const id = await createMember('a');

  const del = await call('DELETE', `/api/members/${id}`);
  assert.equal(del.status, 200);
  assert.deepEqual(del.json, { success: true });

  const get = await call('GET', `/api/members/${id}`);
  assert.equal(get.status, 404, 'member should be gone after deletion');
  assert.ok(
    typeof (get.json as { error: string }).error === 'string',
    'GET 404 body has an error field',
  );
});

test('DELETE /api/members/:id — non-existent ID returns 404', async () => {
  const res = await call('DELETE', '/api/members/999999');
  assert.equal(res.status, 404);
  assert.ok(
    typeof (res.json as { error: string }).error === 'string',
    '404 body has an error field',
  );
});

test('DELETE /api/members/:id — repeat delete returns 404 with same shape', async () => {
  const id = await createMember('b');

  const first = await call('DELETE', `/api/members/${id}`);
  assert.equal(first.status, 200, 'first delete should succeed');
  assert.deepEqual(first.json, { success: true });

  const second = await call('DELETE', `/api/members/${id}`);
  assert.equal(second.status, 404, 'second delete must return 404');
  assert.ok(
    typeof (second.json as { error: string }).error === 'string',
    'repeat-delete 404 body has an error field matching the same shape as case 2',
  );
});

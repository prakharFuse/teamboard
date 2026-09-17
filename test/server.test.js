import { strict as assert } from 'node:assert';
import { test, before, after } from 'node:test';
import { startServer } from '../src/server.js';

const ENV_KEY = 'TEAMBOARD_API_TOKEN';
const FAKE_TOKEN = 'fake-test-token';
const originalToken = process.env[ENV_KEY];

let server;
let baseUrl;

before(async () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  server = await startServer(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (originalToken === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = originalToken;
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/members/count returns the active count when authorized', async () => {
  const res = await fetch(`${baseUrl}/api/members/count`, {
    headers: { authorization: `Bearer ${FAKE_TOKEN}` },
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body, { count: 3 });
});

test('GET /api/members/count responds with application/json content-type', async () => {
  const res = await fetch(`${baseUrl}/api/members/count`, {
    headers: { authorization: `Bearer ${FAKE_TOKEN}` },
  });
  await res.json();
  assert.equal(res.headers.get('content-type'), 'application/json');
});

test('GET /api/members/count returns 401 with no authorization header', async () => {
  const res = await fetch(`${baseUrl}/api/members/count`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.deepEqual(body, { error: 'unauthorized' });
});

test('GET /api/members/count returns 401 with a wrong token', async () => {
  const res = await fetch(`${baseUrl}/api/members/count`, {
    headers: { authorization: 'Bearer wrong-token' },
  });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.deepEqual(body, { error: 'unauthorized' });
});

test('POST /api/members/count returns 405', async () => {
  const res = await fetch(`${baseUrl}/api/members/count`, {
    method: 'POST',
    headers: { authorization: `Bearer ${FAKE_TOKEN}` },
  });
  const body = await res.json();
  assert.equal(res.status, 405);
  assert.deepEqual(body, { error: 'method_not_allowed' });
});

test('GET /api/members/nope returns 404', async () => {
  const res = await fetch(`${baseUrl}/api/members/nope`, {
    headers: { authorization: `Bearer ${FAKE_TOKEN}` },
  });
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.deepEqual(body, { error: 'not_found' });
});

test('GET / returns 404', async () => {
  const res = await fetch(`${baseUrl}/`, {
    headers: { authorization: `Bearer ${FAKE_TOKEN}` },
  });
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.deepEqual(body, { error: 'not_found' });
});

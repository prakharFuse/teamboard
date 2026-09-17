import { strict as assert } from 'node:assert';
import { test, beforeEach, afterEach } from 'node:test';
import { isAuthorized } from '../src/auth.js';

const ENV_KEY = 'TEAMBOARD_API_TOKEN';
const FAKE_TOKEN = 'fake-test-token';
let originalToken;

beforeEach(() => {
  originalToken = process.env[ENV_KEY];
});

afterEach(() => {
  if (originalToken === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = originalToken;
});

test('accepts a matching bearer token', () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  const req = { headers: { authorization: `Bearer ${FAKE_TOKEN}` } };
  assert.equal(isAuthorized(req), true);
});

test('rejects a missing authorization header', () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  const req = { headers: {} };
  assert.equal(isAuthorized(req), false);
});

test('rejects a same-length wrong token', () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  const wrongToken = 'fake-test-tokeX';
  const req = { headers: { authorization: `Bearer ${wrongToken}` } };
  assert.equal(isAuthorized(req), false);
});

test('rejects a different-length wrong token', () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  const req = { headers: { authorization: 'Bearer short' } };
  assert.equal(isAuthorized(req), false);
});

test('rejects the Basic scheme', () => {
  process.env[ENV_KEY] = FAKE_TOKEN;
  const req = { headers: { authorization: `Basic ${FAKE_TOKEN}` } };
  assert.equal(isAuthorized(req), false);
});

test('rejects when the env var is unset', () => {
  delete process.env[ENV_KEY];
  const req = { headers: { authorization: `Bearer ${FAKE_TOKEN}` } };
  assert.equal(isAuthorized(req), false);
});

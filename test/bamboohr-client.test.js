import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { BambooHrClient, mapEmployee } from '../src/bamboohr-client.js';

const FAKE_API_KEY = 'test-fake-bamboohr-key-do-not-use';

function okResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status) {
  return { ok: false, status, json: async () => ({}) };
}

test('mapEmployee returns the exact externalId/email/role shape for a valid record', () => {
  const raw = { id: 'emp-0001', workEmail: 'employee-0001@example.invalid', role: 'contributor' };
  assert.deepEqual(mapEmployee(raw), {
    externalId: 'emp-0001',
    email: 'employee-0001@example.invalid',
    role: 'contributor',
  });
});

test('mapEmployee throws naming workEmail for a malformed email', () => {
  const raw = { id: 'emp-0002', workEmail: 'not-an-email', role: 'contributor' };
  assert.throws(() => mapEmployee(raw), /invalid BambooHR record: workEmail/);
});

test('mapEmployee throws naming id when id is missing', () => {
  const raw = { workEmail: 'employee-0003@example.invalid', role: 'contributor' };
  assert.throws(() => mapEmployee(raw), /invalid BambooHR record:.*\bid\b/);
});

test('fetchDirectory returns the stub employee array on an ok response', async () => {
  const employees = [{ id: 'emp-0001', workEmail: 'employee-0001@example.invalid', role: 'contributor' }];
  const fetchImpl = async () => okResponse(employees);
  const client = new BambooHrClient({ fetchImpl, apiKey: FAKE_API_KEY });

  const result = await client.fetchDirectory();

  assert.deepEqual(result, employees);
});

test('fetchDirectory fails fast on a 401 without retrying', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return errorResponse(401);
  };
  const client = new BambooHrClient({ fetchImpl, apiKey: FAKE_API_KEY });

  await assert.rejects(() => client.fetchDirectory(), /HTTP 401/);
  assert.equal(calls.length, 1);
});

test('fetchDirectory throws naming the status on a 500', async () => {
  const fetchImpl = async () => errorResponse(500);
  const client = new BambooHrClient({ fetchImpl, apiKey: FAKE_API_KEY });

  await assert.rejects(() => client.fetchDirectory(), /HTTP 500/);
});

test('fetchDirectory forwards since when provided and omits it otherwise', async () => {
  let capturedUrl;
  const fetchImpl = async (url) => {
    capturedUrl = url;
    return okResponse([]);
  };
  const client = new BambooHrClient({ fetchImpl, apiKey: FAKE_API_KEY });

  await client.fetchDirectory({ since: '2024-01-01' });
  assert.match(capturedUrl, /since=2024-01-01/);

  await client.fetchDirectory();
  assert.doesNotMatch(capturedUrl, /since/);
});

test('fetchDirectory throws Missing BAMBOOHR_API_KEY and makes no requests without an apiKey', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return okResponse([]);
  };
  const client = new BambooHrClient({ fetchImpl, apiKey: '' });

  await assert.rejects(() => client.fetchDirectory(), /Missing BAMBOOHR_API_KEY/);
  assert.equal(calls.length, 0);
});

test('the 401 failure message never includes the API key', async () => {
  const fetchImpl = async () => errorResponse(401);
  const client = new BambooHrClient({ fetchImpl, apiKey: FAKE_API_KEY });

  try {
    await client.fetchDirectory();
    assert.fail('expected fetchDirectory to throw');
  } catch (error) {
    assert.doesNotMatch(error.message, new RegExp(FAKE_API_KEY));
  }
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApiClient } from '../src/api-client.js';
import { setLevel } from '../src/logger.js';

async function withFetch(stub, fn) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  setLevel('error');
  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
    setLevel('info');
  }
}

test('listTasks uses the default base URL and page size', async () => {
  const urls = [];
  await withFetch(
    async (url) => {
      urls.push(url);
      return { ok: true, json: async () => [] };
    },
    async () => {
      await new ApiClient().listTasks(1);
    },
  );
  assert.deepStrictEqual(urls, ['https://api.teamboard.example.com/v1/tasks?page=1&per_page=50']);
});

test('listTasks honours baseUrl and pageSize options', async () => {
  const urls = [];
  await withFetch(
    async (url) => {
      urls.push(url);
      return { ok: true, json: async () => [] };
    },
    async () => {
      await new ApiClient({ baseUrl: 'http://localhost:1/v1', pageSize: 10 }).listTasks(2);
    },
  );
  assert.deepStrictEqual(urls, ['http://localhost:1/v1/tasks?page=2&per_page=10']);
});

test('request retries up to maxAttempts and rethrows the last error', async () => {
  let calls = 0;
  await withFetch(
    async () => {
      calls += 1;
      throw new Error('boom');
    },
    async () => {
      const client = new ApiClient({ maxAttempts: 2, backoffBaseMs: 0 });
      await assert.rejects(() => client.listTasks(1), /boom/);
    },
  );
  assert.equal(calls, 2);
});

test('request rejects with the HTTP status on a non-ok response', async () => {
  await withFetch(
    async () => ({ ok: false, status: 503 }),
    async () => {
      const client = new ApiClient({ maxAttempts: 1, backoffBaseMs: 0 });
      await assert.rejects(() => client.listTasks(1), /HTTP 503/);
    },
  );
});

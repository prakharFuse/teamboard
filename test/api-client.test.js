import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApiClient } from '../src/api-client.js';

const BASE_URL = 'https://api.teamboard.test/v1';

// Replace globalThis.fetch for one test; every call's init is recorded.
function stubFetch(t, status = 200) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(status === 200 ? '[]' : null, { status });
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  return calls;
}

test('sends X-Workspace-Id when a workspace is configured', async (t) => {
  const calls = stubFetch(t);
  const client = new ApiClient(BASE_URL, { workspaceId: 'test-ws' });

  await client.request('/tasks');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${BASE_URL}/tasks`);
  assert.equal(calls[0].init.headers['X-Workspace-Id'], 'test-ws');
});

test('omits X-Workspace-Id when no workspace is configured', async (t) => {
  const calls = stubFetch(t);
  const client = new ApiClient(BASE_URL);

  await client.request('/tasks');

  const names = Object.keys(calls[0].init.headers).map((name) => name.toLowerCase());
  assert.ok(!names.includes('x-workspace-id'));
});

test('configured workspace overrides a caller X-Workspace-Id and keeps other headers', async (t) => {
  const calls = stubFetch(t);
  const client = new ApiClient(BASE_URL, { workspaceId: 'test-ws' });

  await client.request('/tasks', { headers: { 'x-workspace-id': 'other-ws', Accept: 'application/json' } });

  assert.deepEqual(calls[0].init.headers, { Accept: 'application/json', 'X-Workspace-Id': 'test-ws' });
});

test('403 rejects with the workspace message without retrying', async (t) => {
  const calls = stubFetch(t, 403);
  const client = new ApiClient(BASE_URL, { workspaceId: 'test-ws' });

  await assert.rejects(client.request('/tasks'), { message: 'HTTP 403: access denied for workspace test-ws' });
  assert.equal(calls.length, 1);
});

test('403 without a configured workspace names the Parent Co default', async (t) => {
  const calls = stubFetch(t, 403);
  const client = new ApiClient(BASE_URL);

  await assert.rejects(client.request('/tasks'), { message: 'HTTP 403: access denied for workspace parent-co' });
  assert.equal(calls.length, 1);
});

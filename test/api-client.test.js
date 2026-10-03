import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApiClient } from '../src/api-client.js';

// ApiClient calls the global fetch with real retries and sleeps; every test
// stubs fetch with an immediate success and restores the original afterwards.
async function captureRequest(run) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => [] };
  };
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 1);
  return calls[0];
}

test('no X-Workspace-Id header without a workspaceId', async () => {
  const { url, init } = await captureRequest(() => new ApiClient().listTasks(1));
  assert.equal(url, 'https://api.teamboard.example.com/v1/tasks?page=1&per_page=50');
  assert.equal(init.headers?.['X-Workspace-Id'], undefined);
});

test('X-Workspace-Id header is sent with a workspaceId', async () => {
  const { init } = await captureRequest(() => new ApiClient(undefined, { workspaceId: 'ws_brightline' }).listTasks(1));
  assert.equal(init.headers['X-Workspace-Id'], 'ws_brightline');
});

test('caller headers are kept alongside X-Workspace-Id', async () => {
  const client = new ApiClient(undefined, { workspaceId: 'ws_helio' });
  const { init } = await captureRequest(() =>
    client.request('/tasks', { method: 'GET', headers: { Accept: 'application/json' } }),
  );
  assert.deepEqual(init.headers, { Accept: 'application/json', 'X-Workspace-Id': 'ws_helio' });
  assert.equal(init.method, 'GET');
});

test('caller headers pass through unchanged without a workspaceId', async () => {
  const { init } = await captureRequest(() =>
    new ApiClient().request('/tasks', { headers: { Accept: 'application/json' } }),
  );
  assert.deepEqual(init.headers, { Accept: 'application/json' });
});

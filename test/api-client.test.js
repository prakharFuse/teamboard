import { strict as assert } from 'node:assert';
import { test, afterEach } from 'node:test';
import { ApiClient } from '../src/api-client.js';
import { _resetForTests } from '../src/workspaces.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  _resetForTests();
});

// Replace fetch with a stub that records each call and answers 200 [].
function stubFetch() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, json: async () => [] };
  };
  return calls;
}

test('a client with a workspace sends X-Workspace-Id', async () => {
  const calls = stubFetch();
  await new ApiClient(undefined, { workspaceId: 'ws-parent-co' }).listTasks(1);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].init.headers, { 'X-Workspace-Id': 'ws-parent-co' });
});

test('X-Workspace-Id is merged with caller-supplied headers', async () => {
  const calls = stubFetch();
  await new ApiClient(undefined, { workspaceId: 'ws-parent-co' }).request('/x', {
    headers: { Accept: 'application/json' },
  });
  assert.deepEqual(calls[0].init.headers, {
    Accept: 'application/json',
    'X-Workspace-Id': 'ws-parent-co',
  });
});

test('a client without a workspace sends no headers at all', async () => {
  const calls = stubFetch();
  await new ApiClient().listTasks(1);
  assert.deepEqual(Object.keys(calls[0].init), ['signal']);
  assert.equal('headers' in calls[0].init, false);
});

test('a workspace slug is sent as the canonical id', async () => {
  const calls = stubFetch();
  await new ApiClient(undefined, { workspaceId: 'parent-co' }).listTasks(1);
  assert.deepEqual(calls[0].init.headers, { 'X-Workspace-Id': 'ws-parent-co' });
});

test('an unknown workspace throws in the constructor', () => {
  const calls = stubFetch();
  assert.throws(() => new ApiClient(undefined, { workspaceId: 'nope' }), /Unknown workspace/);
  assert.equal(calls.length, 0);
});

test('the request URL keeps the default base URL and page size', async () => {
  const calls = stubFetch();
  await new ApiClient(undefined, { workspaceId: 'ws-parent-co' }).listTasks(1);
  assert.equal(calls[0].url, 'https://api.teamboard.example.com/v1/tasks?page=1&per_page=50');
});

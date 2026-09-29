import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

function run(...args) {
  return spawnSync(process.execPath, ['src/index.js', ...args], { cwd: REPO_ROOT, encoding: 'utf8' });
}

// `status` logs "current settings {json}"; return the parsed JSON.
function settingsFrom(stdout) {
  assert.match(stdout, /INFO current settings \{/);
  return JSON.parse(stdout.slice(stdout.indexOf('{')));
}

test('status without --workspace prints the unchanged settings', () => {
  const result = run('status');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(settingsFrom(result.stdout), DEFAULTS);
});

test('status --workspace parent-co includes the workspaceId', () => {
  const result = run('status', '--workspace', 'parent-co');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(settingsFrom(result.stdout), { workspaceId: 'parent-co', ...DEFAULTS });
});

test('--workspace may come before the command', () => {
  const result = run('--workspace', 'parent-co', 'status');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(settingsFrom(result.stdout).workspaceId, 'parent-co');
});

test('--workspace=<slug> form is accepted', () => {
  const result = run('status', '--workspace=parent-co');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(settingsFrom(result.stdout).workspaceId, 'parent-co');
});

test('an unknown workspace exits 1 with an error', () => {
  const result = run('status', '--workspace', 'nope');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown workspace: nope/);
  assert.equal(result.stdout, '');
});

test('a trailing --workspace without a value exits 1', () => {
  const result = run('status', '--workspace');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing value for --workspace/);
  assert.equal(result.stdout, '');
});

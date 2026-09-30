import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Never run `tasks` here: it makes a real network call.
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const DEFAULT_SETTINGS_JSON =
  '{"notifications.enabled":"true","board.columns":"todo,doing,done","retention.days":"30"}';

function runCli(...args) {
  return spawnSync(process.execPath, ['src/index.js', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
}

test('status exits 0 and prints the default settings', () => {
  const result = runCli('status');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(DEFAULT_SETTINGS_JSON), result.stdout);
});

test('status --workspace parent-co exits 0 with the same settings', () => {
  const result = runCli('status', '--workspace', 'parent-co');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(DEFAULT_SETTINGS_JSON), result.stdout);
  assert.ok(!result.stderr.includes('unknown command'), result.stderr);
});

test('status --workspace=parent-co exits 0', () => {
  const result = runCli('status', '--workspace=parent-co');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(DEFAULT_SETTINGS_JSON), result.stdout);
});

test('status --workspace with an unknown slug exits 1', () => {
  const result = runCli('status', '--workspace', 'does-not-exist');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown workspace: does-not-exist/);
});

test('status --workspace with no value exits 1', () => {
  const result = runCli('status', '--workspace');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing value for --workspace/);
});

test('--help exits 0 and documents --workspace', () => {
  const result = runCli('--help');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('--workspace <slug>'), result.stdout);
});

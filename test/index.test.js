import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Runs the real CLI in a child process. `tasks` is never exercised here: it
// makes a network call that is expected to fail slowly.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function cli(...args) {
  return spawnSync(process.execPath, ['src/index.js', ...args], { cwd: repoRoot, encoding: 'utf8' });
}

const DEFAULT_SETTINGS_JSON =
  '{"notifications.enabled":"true","board.columns":"todo,doing,done","retention.days":"30"}';

test('default status output is unchanged', () => {
  const result = cli();
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes(`INFO current settings ${DEFAULT_SETTINGS_JSON}`));
  assert.equal(result.stderr, '');
});

test('status with --workspace=brightline succeeds', () => {
  const result = cli('status', '--workspace=brightline');
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes(`INFO current settings ${DEFAULT_SETTINGS_JSON}`));
  assert.equal(result.stderr, '');
});

test('an unknown workspace exits 1 with a clean error', () => {
  const result = cli('status', '--workspace=nope');
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('ERROR unknown workspace {"workspace":"nope"}'));
  assert.ok(!result.stderr.includes('    at '), 'stderr must not contain a stack trace');
  assert.equal(result.stdout, '');
});

test('an empty --workspace= value is rejected as unknown', () => {
  const result = cli('--workspace=');
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('unknown workspace'));
});

test('the workspaces command lists all four slugs', () => {
  const result = cli('workspaces');
  assert.equal(result.status, 0);
  const prefix = 'INFO workspaces ';
  const start = result.stdout.indexOf(prefix);
  assert.notEqual(start, -1);
  const listed = JSON.parse(result.stdout.slice(start + prefix.length));
  assert.deepEqual(
    listed.map((workspace) => workspace.slug),
    ['parent-co', 'brightline', 'northstar', 'helio'],
  );
  for (const workspace of listed) {
    assert.deepEqual(Object.keys(workspace), ['id', 'slug', 'name']);
  }
});

test('help documents the workspaces command and --workspace=<slug>', () => {
  const result = cli('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^\s+workspaces\s+\S/m);
  assert.ok(result.stdout.includes('--workspace=<slug>'));
});

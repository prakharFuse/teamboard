import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { allSettings, getSetting, setSetting } from '../src/store.js';
import { registerWorkspace } from '../src/workspaces.js';

// Mirrors the unexported DEFAULTS in src/store.js.
const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

registerWorkspace({ slug: 'test-ws', name: 'Test Workspace' });

test('calls without a workspace read and write Parent Co', () => {
  assert.equal(getSetting('retention.days'), '30');
  setSetting('board.columns', 'backlog,done');
  assert.equal(getSetting('board.columns'), 'backlog,done');
  assert.equal(getSetting('board.columns', 'parent-co'), 'backlog,done');
  assert.equal(allSettings()['board.columns'], 'backlog,done');
});

test('Parent Co and a registered workspace do not share overrides', () => {
  setSetting('notifications.enabled', 'false');
  setSetting('retention.days', '90', 'test-ws');

  assert.equal(getSetting('notifications.enabled'), 'false');
  assert.equal(getSetting('notifications.enabled', 'test-ws'), 'true');
  assert.equal(getSetting('retention.days', 'test-ws'), '90');
  assert.equal(getSetting('retention.days'), '30');
});

test('allSettings for a workspace is DEFAULTS merged with its own overrides only', () => {
  setSetting('retention.days', '90', 'test-ws');
  setSetting('board.columns', 'backlog,done', 'parent-co');
  assert.deepEqual(allSettings('test-ws'), { ...DEFAULTS, 'retention.days': '90' });
});

test('getSetting throws for an unknown workspace', () => {
  assert.throws(() => getSetting('retention.days', 'nope'), { message: 'Unknown workspace: nope' });
});

test('setSetting throws for an unknown workspace', () => {
  assert.throws(() => setSetting('retention.days', '1', 'nope'), { message: 'Unknown workspace: nope' });
});

test('allSettings throws for an unknown workspace', () => {
  assert.throws(() => allSettings('nope'), { message: 'Unknown workspace: nope' });
});

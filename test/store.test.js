import { strict as assert } from 'node:assert';
import { test, beforeEach } from 'node:test';
import { _resetForTests as resetStore, allSettings, getSetting, setSetting } from '../src/store.js';
import { _resetForTests as resetWorkspaces, registerWorkspace } from '../src/workspaces.js';

const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

beforeEach(() => {
  resetStore();
  resetWorkspaces();
  registerWorkspace({ id: 'ws-test-b', slug: 'test-b', name: 'Test B' });
});

test('getSetting returns the default when no workspace is passed', () => {
  assert.equal(getSetting('retention.days'), '30');
});

test('setSetting without a workspace writes to Parent Co and merges over DEFAULTS', () => {
  setSetting('retention.days', '60');
  assert.equal(getSetting('retention.days'), '60');
  assert.deepEqual(allSettings(), {
    'notifications.enabled': 'true',
    'board.columns': 'todo,doing,done',
    'retention.days': '60',
  });
});

test('a write to another workspace is not visible in Parent Co', () => {
  setSetting('retention.days', '90', 'ws-test-b');
  assert.equal(getSetting('retention.days'), '30');
  assert.equal(getSetting('retention.days', 'ws-test-b'), '90');
});

test('a Parent Co write is not visible in another workspace', () => {
  setSetting('retention.days', '60');
  assert.equal(getSetting('retention.days', 'ws-test-b'), '30');
  assert.equal(getSetting('retention.days', 'ws-parent-co'), '60');
});

test('allSettings for a workspace with no writes equals DEFAULTS exactly', () => {
  assert.deepEqual(allSettings('ws-test-b'), DEFAULTS);
});

test('getSetting throws for an unknown workspace', () => {
  assert.throws(() => getSetting('x', 'nope'), /Unknown workspace/);
});

test('setSetting throws for an unknown workspace and writes nothing', () => {
  assert.throws(() => setSetting('x', 'y', 'nope'), /Unknown workspace/);
  assert.equal(getSetting('x'), undefined);
});

test('getSetting with a null workspace throws rather than reading Parent Co', () => {
  setSetting('retention.days', '60');
  assert.throws(() => getSetting('retention.days', null), /Unknown workspace/);
});

test('getSetting with an empty workspace throws rather than reading Parent Co', () => {
  setSetting('retention.days', '60');
  assert.throws(() => getSetting('retention.days', ''), /Unknown workspace/);
});

test('a workspace slug reads and writes the same settings as its id', () => {
  setSetting('retention.days', '45', 'test-b');
  assert.equal(getSetting('retention.days', 'ws-test-b'), '45');
  setSetting('board.columns', 'todo,done', 'ws-test-b');
  assert.deepEqual(allSettings('test-b'), {
    'notifications.enabled': 'true',
    'board.columns': 'todo,done',
    'retention.days': '45',
  });
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { auditEntries } from '../src/audit-log.js';
import { allSettings, getSetting, setSetting } from '../src/store.js';
import { PARENT_CO_ID } from '../src/workspaces.js';

// The store is a module singleton: every test restores the keys it changes.
const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

function restore(key, workspaceId) {
  setSetting(key, DEFAULTS[key], { workspaceId });
}

test('legacy allSettings() with no workspace returns exactly the defaults', () => {
  assert.deepEqual(allSettings(), DEFAULTS);
});

test('legacy getSetting(key) with no workspace returns the default', () => {
  assert.equal(getSetting('retention.days'), '30');
});

test('legacy setSetting(key, value) with no options writes Parent Co', () => {
  try {
    setSetting('retention.days', '90');
    assert.equal(getSetting('retention.days', PARENT_CO_ID), '90');
    assert.equal(allSettings(PARENT_CO_ID)['retention.days'], '90');
  } finally {
    restore('retention.days');
  }
});

test('a Brightline write does not leak into Parent Co', () => {
  try {
    setSetting('board.columns', 'backlog,done', { workspaceId: 'ws_brightline' });
    assert.equal(getSetting('board.columns', 'ws_brightline'), 'backlog,done');
    assert.equal(getSetting('board.columns'), DEFAULTS['board.columns']);
    assert.deepEqual(allSettings(), DEFAULTS);
  } finally {
    restore('board.columns', 'ws_brightline');
  }
});

test('a Parent Co write does not leak into Brightline', () => {
  try {
    setSetting('notifications.enabled', 'false');
    assert.equal(getSetting('notifications.enabled'), 'false');
    assert.equal(getSetting('notifications.enabled', 'ws_brightline'), DEFAULTS['notifications.enabled']);
    assert.deepEqual(allSettings('ws_brightline'), DEFAULTS);
  } finally {
    restore('notifications.enabled');
  }
});

test('a fresh workspace starts with the defaults', () => {
  assert.deepEqual(allSettings('ws_northstar'), DEFAULTS);
});

test('getSetting rejects an unknown workspace', () => {
  assert.throws(() => getSetting('retention.days', 'ws_nope'), { message: 'Unknown workspace: ws_nope' });
});

test('setSetting rejects an unknown workspace', () => {
  assert.throws(() => setSetting('retention.days', '1', { workspaceId: 'ws_nope' }), {
    message: 'Unknown workspace: ws_nope',
  });
});

test('allSettings rejects an unknown workspace', () => {
  assert.throws(() => allSettings('ws_nope'), { message: 'Unknown workspace: ws_nope' });
});

test('setSetting to an unknown workspace records no audit row', () => {
  const before = auditEntries().length;
  assert.throws(() => setSetting('retention.days', '1', { workspaceId: 'ws_nope' }));
  assert.equal(auditEntries().length, before);
});

test('setSetting records one audit row with the default system actor', () => {
  const before = auditEntries(PARENT_CO_ID).length;
  try {
    setSetting('retention.days', '60');
    const rows = auditEntries(PARENT_CO_ID);
    assert.equal(rows.length, before + 1);
    const row = rows.at(-1);
    assert.equal(row.actor_email, 'system');
    assert.equal(row.workspace_id, PARENT_CO_ID);
    assert.equal(row.action, 'settings.update');
    assert.equal(row.entity_id, 'retention.days');
  } finally {
    restore('retention.days');
  }
});

test('setSetting records one audit row with an explicit actor', () => {
  const before = auditEntries('ws_helio').length;
  try {
    setSetting('retention.days', '14', { workspaceId: 'ws_helio', actorEmail: 'actor@example.test' });
    const rows = auditEntries('ws_helio');
    assert.equal(rows.length, before + 1);
    const row = rows.at(-1);
    assert.equal(row.actor_email, 'actor@example.test');
    assert.equal(row.workspace_id, 'ws_helio');
    assert.equal(row.action, 'settings.update');
    assert.equal(row.entity_id, 'retention.days');
  } finally {
    restore('retention.days', 'ws_helio');
  }
});

test('setSetting with an empty actor is rejected and does not write', () => {
  assert.throws(() => setSetting('retention.days', '1', { actorEmail: '' }), {
    message: 'Missing audit field: actorEmail',
  });
  assert.equal(getSetting('retention.days'), DEFAULTS['retention.days']);
});

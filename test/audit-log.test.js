import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { auditEntries, recordAudit } from '../src/audit-log.js';

const ACTOR = 'actor@example.test';

function validEntry(overrides = {}) {
  return {
    actorEmail: ACTOR,
    workspaceId: 'ws_brightline',
    action: 'member.update',
    entityId: 'member-1',
    ...overrides,
  };
}

test('recordAudit returns a snake_case row in the Compliance column order', () => {
  const row = recordAudit(validEntry());
  assert.deepEqual(Object.keys(row), ['actor_email', 'workspace_id', 'action', 'entity_id', 'at']);
  assert.equal(row.actor_email, ACTOR);
  assert.equal(row.workspace_id, 'ws_brightline');
  assert.equal(row.action, 'member.update');
  assert.equal(row.entity_id, 'member-1');
});

test('recordAudit stamps `at` as a valid ISO-8601 UTC timestamp', () => {
  const before = Date.now();
  const row = recordAudit(validEntry());
  const at = Date.parse(row.at);
  assert.equal(new Date(at).toISOString(), row.at);
  assert.ok(at >= before && at <= Date.now());
});

for (const field of ['actorEmail', 'workspaceId', 'action', 'entityId']) {
  test(`recordAudit rejects a missing ${field}`, () => {
    const entry = validEntry();
    delete entry[field];
    assert.throws(() => recordAudit(entry), { message: `Missing audit field: ${field}` });
  });

  test(`recordAudit rejects an empty ${field}`, () => {
    assert.throws(() => recordAudit(validEntry({ [field]: '' })), { message: `Missing audit field: ${field}` });
  });
}

test('recordAudit rejects a non-string field', () => {
  assert.throws(() => recordAudit(validEntry({ entityId: 42 })), { message: 'Missing audit field: entityId' });
});

test('recordAudit with no argument rejects the first field', () => {
  assert.throws(() => recordAudit(), { message: 'Missing audit field: actorEmail' });
});

test('a rejected entry is not recorded', () => {
  const before = auditEntries().length;
  assert.throws(() => recordAudit(validEntry({ action: '' })));
  assert.equal(auditEntries().length, before);
});

test('auditEntries filters by workspace', () => {
  recordAudit(validEntry({ workspaceId: 'ws_helio', entityId: 'helio-only' }));
  recordAudit(validEntry({ workspaceId: 'ws_northstar', entityId: 'northstar-only' }));
  const helio = auditEntries('ws_helio');
  assert.ok(helio.length > 0);
  assert.ok(helio.every((row) => row.workspace_id === 'ws_helio'));
  assert.ok(helio.some((row) => row.entity_id === 'helio-only'));
  assert.ok(!helio.some((row) => row.entity_id === 'northstar-only'));
});

test('auditEntries without a workspace returns every row', () => {
  recordAudit(validEntry({ workspaceId: 'ws_helio' }));
  recordAudit(validEntry({ workspaceId: 'ws_northstar' }));
  const workspaces = new Set(auditEntries().map((row) => row.workspace_id));
  assert.ok(workspaces.has('ws_helio'));
  assert.ok(workspaces.has('ws_northstar'));
});

test('auditEntries for an unused workspace is empty', () => {
  assert.deepEqual(auditEntries('ws_unused'), []);
});

test('the row returned by recordAudit is frozen', () => {
  const row = recordAudit(validEntry());
  assert.ok(Object.isFrozen(row));
  assert.throws(() => {
    row.action = 'tampered';
  }, TypeError);
});

test('mutating a row from auditEntries does not change the log', () => {
  recordAudit(validEntry({ workspaceId: 'ws_immutability', entityId: 'original' }));
  const [copy] = auditEntries('ws_immutability');
  copy.entity_id = 'tampered';
  assert.equal(auditEntries('ws_immutability')[0].entity_id, 'original');
});

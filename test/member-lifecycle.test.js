import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { resetMembers, getMember, getMemberByExternalId, upsertMember, allMembers } from '../src/members.js';
import {
  importFromBambooHR,
  deactivateMember,
  reconcilePendingDeprovisions,
  updateMemberRole,
  reactivateMember,
  SSO_DEPROVISION_SLA_MS,
} from '../src/member-lifecycle.js';

const IMPORT_FIXTURE = [
  { id: 'emp-0001', workEmail: 'employee-0001@example.invalid', role: 'contributor' },
  { id: 'emp-0002', workEmail: 'employee-0002@example.invalid', role: 'admin' },
  { id: 'emp-0003', workEmail: 'not-an-email', role: 'contributor' },
];

function fakeBambooClient(employees) {
  return { fetchDirectory: async () => employees };
}

function fakeSsoClient(dispatched, { shouldFail = false } = {}) {
  return {
    deprovision: async (memberId) => {
      dispatched.push(memberId);
      if (shouldFail) {
        throw new Error('SSO deprovision failed: HTTP 503');
      }
    },
  };
}

// --- BambooHR import path (Step 14) ---

test('a malformed record is excluded from the store and reported in failed', async () => {
  resetMembers();
  const client = fakeBambooClient(IMPORT_FIXTURE);

  const summary = await importFromBambooHR({ client });

  assert.equal(summary.failed.length, 1);
  assert.equal(summary.failed[0].externalId, 'emp-0003');
  assert.equal(getMemberByExternalId('emp-0003'), undefined);
  assert.notEqual(summary.imported + summary.updated, IMPORT_FIXTURE.length);
});

test('a full import then an incremental import of the same fixture converges to one member set', async () => {
  resetMembers();
  const client = fakeBambooClient(IMPORT_FIXTURE);

  const first = await importFromBambooHR({ client });
  assert.equal(first.imported, 2);
  assert.equal(first.updated, 0);
  assert.equal(first.skipped, 0);
  assert.equal(first.failed.length, 1);
  assert.equal(first.imported + first.updated + first.skipped + first.failed.length, IMPORT_FIXTURE.length);

  const sizeAfterFirst = allMembers().length;

  const second = await importFromBambooHR({ client });
  assert.equal(second.imported, 0);
  assert.equal(second.updated, 2);
  assert.equal(second.skipped, 0);
  assert.equal(second.failed.length, 1);
  assert.equal(second.imported + second.updated + second.skipped + second.failed.length, IMPORT_FIXTURE.length);

  assert.equal(allMembers().length, sizeAfterFirst);
});

test('an auth failure from fetchDirectory propagates and persists no members', async () => {
  resetMembers();
  const client = {
    fetchDirectory: async () => {
      throw new Error('BambooHR request failed: HTTP 401');
    },
  };

  await assert.rejects(() => importFromBambooHR({ client }), /HTTP 401/);
  assert.deepEqual(allMembers(), []);
});

test('an empty directory returns an all-zero summary', async () => {
  resetMembers();
  const client = fakeBambooClient([]);

  const summary = await importFromBambooHR({ client });

  assert.deepEqual(summary, { imported: 0, updated: 0, skipped: 0, failed: [] });
});

// --- Deactivation / SSO deprovisioning (Step 15) ---

test('deactivateMember dispatches exactly one deprovision call and sets ssoDeprovisionedAt', async () => {
  resetMembers();
  upsertMember('member-1', { status: 'active' });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  const result = await deactivateMember('member-1', { ssoClient, now: 1000 });

  assert.deepEqual(dispatched, ['member-1']);
  assert.equal(result.ok, true);
  assert.equal(result.member.ssoDeprovisionedAt, 1000);
});

test('a failing deprovision leaves the member deactivated and pending, without ssoDeprovisionedAt', async () => {
  resetMembers();
  upsertMember('member-2', { status: 'active' });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched, { shouldFail: true });

  const result = await deactivateMember('member-2', { ssoClient, now: 2000 });

  assert.equal(result.ok, false);
  assert.match(result.reason, /HTTP 503/);
  assert.equal(result.member.status, 'deactivated');
  assert.equal(typeof result.member.deprovisionPendingSince, 'number');
  assert.equal(result.member.ssoDeprovisionedAt, undefined);
});

test('calling deactivateMember twice dispatches only once and preserves the original deactivatedAt', async () => {
  resetMembers();
  upsertMember('member-3', { status: 'active' });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  const first = await deactivateMember('member-3', { ssoClient, now: 1000 });
  const second = await deactivateMember('member-3', { ssoClient, now: 5000 });

  assert.deepEqual(dispatched, ['member-3']);
  assert.equal(first.member.deactivatedAt, 1000);
  assert.equal(second.member.deactivatedAt, 1000);
});

test('deactivating an unknown id throws and dispatches nothing', async () => {
  resetMembers();
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  await assert.rejects(() => deactivateMember('ghost', { ssoClient, now: 1000 }), /Unknown member id/);
  assert.deepEqual(dispatched, []);
});

// --- Reconciliation (Step 16) ---

test('reconcile re-dispatches a member pending beyond the SLA and marks it complete', async () => {
  resetMembers();
  const now = 1_000_000_000;
  upsertMember('member-late', {
    status: 'deactivated',
    deprovisionPendingSince: now - SSO_DEPROVISION_SLA_MS - 1,
  });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  const summary = await reconcilePendingDeprovisions({ ssoClient, now, slaMs: SSO_DEPROVISION_SLA_MS });

  assert.deepEqual(dispatched, ['member-late']);
  assert.deepEqual(summary.redispatched, ['member-late']);
  assert.equal(getMember('member-late').ssoDeprovisionedAt, now);
});

test('a member pending for exactly the SLA is reported as within-SLA (boundary)', async () => {
  resetMembers();
  const now = 1_000_000_000;
  upsertMember('member-boundary', {
    status: 'deactivated',
    deprovisionPendingSince: now - SSO_DEPROVISION_SLA_MS,
  });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  const summary = await reconcilePendingDeprovisions({ ssoClient, now, slaMs: SSO_DEPROVISION_SLA_MS });

  assert.deepEqual(summary.withinSla, ['member-boundary']);
  assert.deepEqual(dispatched, []);
});

test('a member already carrying ssoDeprovisionedAt is reported as already-complete', async () => {
  resetMembers();
  const now = 1_000_000_000;
  upsertMember('member-done', {
    status: 'deactivated',
    ssoDeprovisionedAt: now - 100,
  });
  const dispatched = [];
  const ssoClient = fakeSsoClient(dispatched);

  const summary = await reconcilePendingDeprovisions({ ssoClient, now, slaMs: SSO_DEPROVISION_SLA_MS });

  assert.deepEqual(summary.alreadyComplete, ['member-done']);
  assert.deepEqual(dispatched, []);
});

// --- No regression in role updates and reactivation ---

test('updateMemberRole updates only role and never touches SSO', () => {
  resetMembers();
  upsertMember('member-role', { status: 'active', email: 'member-role@example.invalid', role: 'member' });
  const dispatched = [];

  const updated = updateMemberRole('member-role', 'admin');

  assert.equal(updated.role, 'admin');
  assert.equal(updated.status, 'active');
  assert.equal(updated.email, 'member-role@example.invalid');
  assert.deepEqual(dispatched, []);
});

test('reactivateMember updates only status and never touches SSO', () => {
  resetMembers();
  upsertMember('member-reactivate', {
    status: 'deactivated',
    email: 'member-reactivate@example.invalid',
    role: 'contributor',
    deactivatedAt: 500,
  });
  const dispatched = [];

  const reactivated = reactivateMember('member-reactivate');

  assert.equal(reactivated.status, 'active');
  assert.equal(reactivated.email, 'member-reactivate@example.invalid');
  assert.equal(reactivated.role, 'contributor');
  assert.equal(reactivated.deactivatedAt, 500);
  assert.deepEqual(dispatched, []);
});

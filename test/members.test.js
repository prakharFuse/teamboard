import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  getMember,
  getMemberByExternalId,
  membersPendingDeprovision,
  resetMembers,
  upsertMember,
} from '../src/members.js';

test('upsertMember and getMember round-trip a record', () => {
  resetMembers();
  upsertMember('member-1', { externalId: 'ext-1', email: 'member-1@example.invalid' });
  assert.deepEqual(getMember('member-1'), {
    id: 'member-1',
    externalId: 'ext-1',
    email: 'member-1@example.invalid',
  });
});

test('upsertMember shallow-merges and preserves an existing status', () => {
  resetMembers();
  upsertMember('member-1', { status: 'active', role: 'member' });
  upsertMember('member-1', { role: 'admin' });
  const record = getMember('member-1');
  assert.equal(record.status, 'active');
  assert.equal(record.role, 'admin');
});

test('getMember throws Invalid member id for an empty string', () => {
  resetMembers();
  assert.throws(() => getMember(''), /Invalid member id/);
});

test('getMember throws Invalid member id for a non-string', () => {
  resetMembers();
  assert.throws(() => getMember(42), /Invalid member id/);
});

test('getMemberByExternalId resolves the internal id', () => {
  resetMembers();
  upsertMember('member-1', { externalId: 'ext-1' });
  const record = getMemberByExternalId('ext-1');
  assert.equal(record.id, 'member-1');
});

test('membersPendingDeprovision returns only the past-SLA member', () => {
  resetMembers();
  const now = 1_000_000;
  const slaMs = 1000;

  upsertMember('past-sla', { deprovisionPendingSince: now - slaMs - 1 });
  upsertMember('at-sla', { deprovisionPendingSince: now - slaMs });
  upsertMember('already-deprovisioned', {
    deprovisionPendingSince: now - slaMs - 5000,
    ssoDeprovisionedAt: now - 10,
  });

  assert.deepEqual(membersPendingDeprovision(now, slaMs), ['past-sla']);
});

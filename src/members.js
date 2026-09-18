/**
 * In-memory member store.
 *
 * Root cause context: TeamBoard previously had no member lifecycle model at
 * all, so status changes had nowhere to be recorded and nothing to propagate
 * to external integrations (BambooHR, SSO). This module is the record of
 * truth those integrations read from and write back to.
 */
const members = new Map();
const byExternalId = new Map();

function assertValidId(id) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`Invalid member id: ${JSON.stringify(id)}`);
  }
}

export function getMember(id) {
  assertValidId(id);
  return members.get(id);
}

export function getMemberByExternalId(externalId) {
  assertValidId(externalId);
  const id = byExternalId.get(externalId);
  return id === undefined ? undefined : members.get(id);
}

export function upsertMember(id, fields) {
  assertValidId(id);
  const existing = members.get(id);
  const record = { ...existing, ...fields, id };
  members.set(id, record);
  if (record.externalId !== undefined) {
    byExternalId.set(record.externalId, id);
  }
  return record;
}

export function allMembers() {
  return Array.from(members.values());
}

export function membersPendingDeprovision(now, slaMs) {
  return allMembers()
    .filter((member) => {
      if (member.ssoDeprovisionedAt !== undefined) return false;
      if (member.deprovisionPendingSince === undefined) return false;
      return now - member.deprovisionPendingSince > slaMs;
    })
    .map((member) => member.id);
}

export function resetMembers() {
  members.clear();
  byExternalId.clear();
}

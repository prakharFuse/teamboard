/**
 * Member lifecycle orchestrator.
 *
 * Root cause (TEAM-6): TeamBoard had no member lifecycle model at all — no
 * record of a member's status, and no path from a status change to the
 * external systems that need to hear about it. That single gap produces both
 * escalations:
 *
 *   1. BambooHR import had nowhere to record a per-record failure, so a bad
 *      record silently vanished from the sync instead of being reported.
 *   2. Deactivating a member never told the SSO provider, so a departed
 *      employee's SSO session outlived their TeamBoard membership indefinitely
 *      (observed: ~3 weeks) instead of being torn down promptly.
 *
 * This module closes both paths: `importFromBambooHR` accumulates per-record
 * failures instead of dropping them, and `deactivateMember` dispatches SSO
 * deprovisioning synchronously as part of deactivation, falling back to
 * `reconcilePendingDeprovisions` to retry within a bounded SLA if the
 * dispatch itself fails.
 *
 * PR #60 (referenced in the ticket as the in-flight fix) could not be
 * inspected from this checkout: the repo has a single commit (605e18e) and no
 * `origin` remote, so there is no branch or diff to review. This change
 * therefore supersedes PR #60 by covering both paths from scratch rather than
 * building on top of it.
 */
import { logger } from './logger.js';
import { getMember, getMemberByExternalId, upsertMember, allMembers } from './members.js';
import { mapEmployee } from './bamboohr-client.js';

export const SSO_DEPROVISION_SLA_MS = 15 * 60 * 1000;

export async function importFromBambooHR({ client, since }) {
  const employees = await client.fetchDirectory({ since });

  const summary = { imported: 0, updated: 0, skipped: 0, failed: [] };
  const seenExternalIds = new Set();

  for (const raw of employees) {
    let externalId = typeof raw?.id === 'string' && raw.id.length > 0 ? raw.id : '<unknown>';
    try {
      const mapped = mapEmployee(raw);
      externalId = mapped.externalId;

      if (seenExternalIds.has(externalId)) {
        summary.skipped += 1;
        continue;
      }
      seenExternalIds.add(externalId);

      const existing = getMemberByExternalId(externalId);
      if (existing) {
        upsertMember(existing.id, {
          externalId: mapped.externalId,
          email: mapped.email,
          role: mapped.role,
        });
        summary.updated += 1;
      } else {
        upsertMember(mapped.externalId, {
          externalId: mapped.externalId,
          email: mapped.email,
          role: mapped.role,
          status: 'active',
        });
        summary.imported += 1;
      }
    } catch (error) {
      summary.failed.push({ externalId, reason: error.message });
    }
  }

  if (summary.imported === 0 && summary.updated === 0 && summary.skipped === 0 && summary.failed.length === 0) {
    logger.info('BambooHR import: no records to process', { since });
  }

  return summary;
}

export function updateMemberRole(id, role) {
  const member = getMember(id);
  if (!member) {
    throw new Error(`Unknown member id: ${id}`);
  }
  return upsertMember(id, { role });
}

export function reactivateMember(id) {
  const member = getMember(id);
  if (!member) {
    throw new Error(`Unknown member id: ${id}`);
  }
  return upsertMember(id, { status: 'active' });
}

export async function deactivateMember(id, { ssoClient, now }) {
  const member = getMember(id);
  if (!member) {
    throw new Error(`Unknown member id: ${id}`);
  }

  const deactivatedAt = member.deactivatedAt ?? now;
  const deactivated = upsertMember(id, { status: 'deactivated', deactivatedAt });

  if (deactivated.ssoDeprovisionedAt !== undefined) {
    return { ok: true, member: deactivated };
  }

  try {
    await ssoClient.deprovision(id);
    const member2 = upsertMember(id, { ssoDeprovisionedAt: now });
    return { ok: true, member: member2 };
  } catch (error) {
    const member2 = upsertMember(id, { deprovisionPendingSince: now });
    logger.error('SSO deprovision failed', { memberId: id });
    return { ok: false, reason: error.message, member: member2 };
  }
}

export async function reconcilePendingDeprovisions({ ssoClient, now, slaMs }) {
  const summary = { redispatched: [], withinSla: [], alreadyComplete: [], failed: [] };

  for (const member of allMembers()) {
    if (member.ssoDeprovisionedAt !== undefined) {
      summary.alreadyComplete.push(member.id);
      continue;
    }

    if (member.deprovisionPendingSince === undefined) {
      continue;
    }

    const elapsed = now - member.deprovisionPendingSince;
    if (elapsed <= slaMs) {
      summary.withinSla.push(member.id);
      continue;
    }

    try {
      await ssoClient.deprovision(member.id);
      upsertMember(member.id, { ssoDeprovisionedAt: now });
      summary.redispatched.push(member.id);
    } catch (error) {
      logger.error('SSO deprovision failed', { memberId: member.id });
      summary.failed.push({ id: member.id, reason: error.message });
    }
  }

  return summary;
}

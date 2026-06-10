import type { DatabaseSync } from 'node:sqlite';

export const RETENTION_YEARS = 7;

export class RetentionPolicyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetentionPolicyViolationError';
  }
}

export function enforceRetentionPolicy(
  deactivationDate: string | null,
  now: Date = new Date()
): void {
  if (deactivationDate === null) {
    return;
  }
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  if (new Date(deactivationDate) > cutoff) {
    throw new RetentionPolicyViolationError(
      `Member record cannot be permanently deleted: deactivation date ${deactivationDate} is within the ${RETENTION_YEARS}-year retention period.`
    );
  }
}

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  deactivation_date: string | null;
  created_at: string;
  updated_at: string;
}

export function deactivateMember(db: DatabaseSync, id: number): MemberRow {
  db.prepare(
    `UPDATE members SET is_active = 0, deactivation_date = date('now'), updated_at = datetime('now') WHERE id = ?`
  ).run(id);
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as unknown as MemberRow;
}

export function hardDeleteMember(db: DatabaseSync, id: number): void {
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as unknown as MemberRow | undefined;
  if (!row) {
    return;
  }
  enforceRetentionPolicy(row.deactivation_date);
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
}

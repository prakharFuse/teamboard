import { DatabaseSync } from 'node:sqlite';

export interface AuditEntry {
  actorEmail: string;
  workspaceId: number;
  action: string;
  entityId?: string | number | null;
}

export function writeAuditLog(db: DatabaseSync, entry: AuditEntry): void {
  db.prepare(
    'INSERT INTO audit_log (actor_email, workspace_id, action, entity_id) VALUES (?, ?, ?, ?)'
  ).run(entry.actorEmail, entry.workspaceId, entry.action, entry.entityId ?? null);
}

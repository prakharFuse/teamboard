// TODO: Compliance team sign-off required before this code is merged (TEAM-8 constraint)
import { DatabaseSync } from 'node:sqlite';

export function writeAuditLog(
  db: DatabaseSync,
  actorEmail: string,
  workspaceId: number,
  action: string,
  entityId: number | null
): void {
  db.prepare(
    'INSERT INTO audit_log (actor_email, workspace_id, action, entity_id, at) VALUES (?, ?, ?, ?, ?)'
  ).run(actorEmail, workspaceId, action, entityId, new Date().toISOString());
}

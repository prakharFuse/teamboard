/**
 * Append-only audit log for workspace-scoped actions.
 *
 * FIXTURE NOTE: the row shape here is the Compliance contract from TEAM-8 —
 * snake_case columns actor_email, workspace_id, action, entity_id, at — and it
 * must not drift without Compliance sign-off (SOC 2 evidence is queried from
 * these columns). Storage is in-memory because this repository has no
 * database; the persistent `audit_log` table is a later phase (see
 * docs/workspaces-rollout.md). Rows are never logged to stdout/stderr.
 */
const rows = [];

const REQUIRED_FIELDS = ['actorEmail', 'workspaceId', 'action', 'entityId'];

export function recordAudit({ actorEmail, workspaceId, action, entityId } = {}) {
  const fields = { actorEmail, workspaceId, action, entityId };
  for (const name of REQUIRED_FIELDS) {
    if (typeof fields[name] !== 'string' || fields[name] === '') {
      throw new Error(`Missing audit field: ${name}`);
    }
  }
  const row = Object.freeze({
    actor_email: actorEmail,
    workspace_id: workspaceId,
    action,
    entity_id: entityId,
    at: new Date().toISOString(),
  });
  rows.push(row);
  return row;
}

/**
 * Returns copies of the recorded rows, optionally limited to one workspace.
 */
export function auditEntries(workspaceId) {
  return rows
    .filter((row) => workspaceId === undefined || row.workspace_id === workspaceId)
    .map((row) => ({ ...row }));
}

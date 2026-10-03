/**
 * Workspace registry: the parent company and each subsidiary legal entity.
 *
 * FIXTURE NOTE: this is phase 1 of the workspaces initiative (TEAM-8). The
 * real system keeps workspaces in a database table synced from Okta; this
 * repository has no database, so the registry is a frozen in-memory list with
 * the same columns (id, slug, name, bamboohr_dept_code_list, okta_group). The
 * department code lists are placeholders until each subsidiary's HR supplies
 * its BambooHR catalogue. See docs/workspaces-rollout.md for what is blocked
 * on systems outside this repo.
 */
export const PARENT_CO_ID = 'ws_parent_co';
export const OKTA_GROUP_PREFIX = 'tb-workspace-';

function defineWorkspace(id, slug, name, bamboohrDeptCodeList) {
  return Object.freeze({
    id,
    slug,
    name,
    bamboohrDeptCodeList: Object.freeze([...bamboohrDeptCodeList]),
    oktaGroup: `${OKTA_GROUP_PREFIX}${slug}`,
  });
}

export const WORKSPACES = Object.freeze([
  defineWorkspace(PARENT_CO_ID, 'parent-co', 'Parent Co', ['ENG', 'OPS', 'FIN', 'HR']),
  defineWorkspace('ws_brightline', 'brightline', 'Brightline', ['BL-ENG', 'BL-OPS']),
  defineWorkspace('ws_northstar', 'northstar', 'Northstar Logistics', ['NS-OPS', 'NS-FLEET']),
  defineWorkspace('ws_helio', 'helio', 'Helio Studios', ['HS-ART', 'HS-PROD']),
]);

export function getWorkspace(id) {
  return WORKSPACES.find((workspace) => workspace.id === id);
}

export function getWorkspaceBySlug(slug) {
  return WORKSPACES.find((workspace) => workspace.slug === slug);
}

/**
 * Maps a user's Okta groups to the workspaces they may access. Matching is
 * exact and case-sensitive on `tb-workspace-<slug>`; unrelated groups are
 * ignored. The result is deduplicated and in registry order.
 */
export function resolveUserWorkspaces(oktaGroups) {
  const groups = new Set(oktaGroups ?? []);
  return WORKSPACES.filter((workspace) => groups.has(workspace.oktaGroup));
}

/**
 * Throws a 403-tagged error unless `workspaceId` is one of `allowedWorkspaceIds`.
 */
export function assertWorkspaceAccess(workspaceId, allowedWorkspaceIds) {
  if ((allowedWorkspaceIds ?? []).includes(workspaceId)) return;
  const error = new Error(`Forbidden workspace: ${workspaceId}`);
  error.status = 403;
  throw error;
}

/**
 * Workspace registry.
 *
 * Each legal entity (the parent company and each subsidiary) lives in its own
 * workspace. Workspaces are keyed by slug; the slug doubles as the id and maps
 * to the Okta group `tb-workspace-<slug>`. Parent Co is always registered and
 * is the default for callers that do not name a workspace, so existing
 * single-tenant consumers keep working unchanged.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OKTA_GROUP_PATTERN = /^tb-workspace-([a-z0-9-]+)$/;

export const DEFAULT_WORKSPACE_ID = 'parent-co';

export const PARENT_CO = Object.freeze({
  id: DEFAULT_WORKSPACE_ID,
  slug: DEFAULT_WORKSPACE_ID,
  name: 'Parent Co',
  bamboohrDeptCodes: Object.freeze([]),
  oktaGroup: `tb-workspace-${DEFAULT_WORKSPACE_ID}`,
});

const workspaces = new Map([[PARENT_CO.id, PARENT_CO]]);

export function getWorkspace(id) {
  const workspace = workspaces.get(id);
  if (!workspace) throw new Error(`Unknown workspace: ${id}`);
  return workspace;
}

export function listWorkspaces() {
  return [...workspaces.values()];
}

export function registerWorkspace({ slug, name, bamboohrDeptCodes = [] } = {}) {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid workspace slug: ${slug}`);
  }
  if (workspaces.has(slug)) throw new Error(`Workspace already registered: ${slug}`);
  const workspace = Object.freeze({
    id: slug,
    slug,
    name: name ?? slug,
    bamboohrDeptCodes: Object.freeze([...bamboohrDeptCodes]),
    oktaGroup: `tb-workspace-${slug}`,
  });
  workspaces.set(slug, workspace);
  return workspace;
}

/**
 * Map a user's Okta groups to the registered workspaces they may access.
 * Only exact `tb-workspace-<slug>` names count (case-sensitive); groups for
 * unregistered slugs are ignored, and each workspace appears at most once.
 */
export function resolveWorkspacesFromGroups(groups = []) {
  const resolved = new Map();
  for (const group of groups) {
    const match = typeof group === 'string' ? OKTA_GROUP_PATTERN.exec(group) : null;
    if (!match) continue;
    const workspace = workspaces.get(match[1]);
    if (workspace) resolved.set(workspace.id, workspace);
  }
  return [...resolved.values()];
}

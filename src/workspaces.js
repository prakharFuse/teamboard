/**
 * Workspace registry.
 *
 * Each workspace isolates one legal entity — the parent company or one of its
 * subsidiaries — so that settings, members and departments are never
 * commingled across entities. Okta groups named `tb-workspace-<slug>` map to
 * the workspace with that slug; see resolveWorkspacesFromGroups().
 *
 * Entries are frozen on registration. Parent Co is seeded at module load and
 * is the workspace legacy callers fall back to when they pass none.
 */
export const OKTA_GROUP_PREFIX = 'tb-workspace-';
export const PARENT_CO_WORKSPACE_ID = 'ws-parent-co';

const PARENT_CO = {
  id: PARENT_CO_WORKSPACE_ID,
  slug: 'parent-co',
  name: 'Parent Co',
  bamboohrDeptCodeList: [],
};

const registry = new Map();

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function freezeWorkspace(ws) {
  return Object.freeze({ ...ws, bamboohrDeptCodeList: Object.freeze([...ws.bamboohrDeptCodeList]) });
}

function findBySlug(slug) {
  for (const ws of registry.values()) {
    if (ws.slug === slug) return ws;
  }
  return undefined;
}

export function registerWorkspace({
  id,
  slug,
  name,
  bamboohrDeptCodeList = [],
  oktaGroup = `${OKTA_GROUP_PREFIX}${slug}`,
}) {
  if (!isNonEmptyString(id)) throw new Error('Workspace id must be a non-empty string');
  if (!isNonEmptyString(slug)) throw new Error('Workspace slug must be a non-empty string');
  if (!isNonEmptyString(name)) throw new Error('Workspace name must be a non-empty string');
  if (oktaGroup !== `${OKTA_GROUP_PREFIX}${slug}`) {
    throw new Error(`Workspace oktaGroup must be ${OKTA_GROUP_PREFIX}${slug}`);
  }
  if (!Array.isArray(bamboohrDeptCodeList)) {
    throw new Error('Workspace bamboohrDeptCodeList must be an array');
  }
  if (registry.has(id)) throw new Error(`Workspace already registered: ${id}`);
  if (findBySlug(slug)) throw new Error(`Workspace already registered: ${slug}`);

  const entry = freezeWorkspace({ id, slug, name, bamboohrDeptCodeList, oktaGroup });
  registry.set(id, entry);
  return entry;
}

export function getWorkspace(idOrSlug) {
  if (!isNonEmptyString(idOrSlug)) throw new Error(`Unknown workspace: ${idOrSlug}`);
  const ws = registry.get(idOrSlug) ?? findBySlug(idOrSlug);
  if (!ws) throw new Error(`Unknown workspace: ${idOrSlug}`);
  return ws;
}

export function listWorkspaces() {
  return [...registry.values()];
}

/**
 * Map Okta group names to the workspaces they grant. Unknown slugs are
 * skipped; there is deliberately no fallback to Parent Co.
 */
export function resolveWorkspacesFromGroups(groups) {
  if (groups === null || groups === undefined) return [];
  const byId = new Map();
  for (const group of groups) {
    if (typeof group !== 'string' || !group.startsWith(OKTA_GROUP_PREFIX)) continue;
    const ws = findBySlug(group.slice(OKTA_GROUP_PREFIX.length));
    if (ws && !byId.has(ws.id)) byId.set(ws.id, ws);
  }
  return [...byId.values()];
}

export function _resetForTests() {
  registry.clear();
  registerWorkspace(PARENT_CO);
}

registerWorkspace(PARENT_CO);

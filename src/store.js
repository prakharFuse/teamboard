/**
 * In-memory settings store, partitioned by workspace.
 *
 * Each workspace gets its own Map of overrides, keyed by the workspace's
 * canonical id (a slug resolves to the same Map as its id). DEFAULTS is shared
 * and read-only: reads fall back to it, writes never touch it. When no
 * workspace is passed, calls resolve to Parent Co so legacy callers keep
 * working for the one-quarter compatibility window; null, empty or unknown
 * workspace ids throw rather than silently reading Parent Co data.
 */
import { getWorkspace, PARENT_CO_WORKSPACE_ID } from './workspaces.js';

const settingsByWorkspace = new Map();

const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

function mapFor(workspaceId = PARENT_CO_WORKSPACE_ID) {
  const { id } = getWorkspace(workspaceId);
  if (!settingsByWorkspace.has(id)) settingsByWorkspace.set(id, new Map());
  return settingsByWorkspace.get(id);
}

export function getSetting(key, workspaceId) {
  return mapFor(workspaceId).get(key) ?? DEFAULTS[key];
}

export function setSetting(key, value, workspaceId) {
  mapFor(workspaceId).set(key, value);
}

export function allSettings(workspaceId) {
  return { ...DEFAULTS, ...Object.fromEntries(mapFor(workspaceId)) };
}

export function _resetForTests() {
  settingsByWorkspace.clear();
}

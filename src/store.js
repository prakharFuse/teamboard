/**
 * In-memory settings store, partitioned per workspace.
 *
 * FIXTURE NOTE: this was the "legacy global settings store" the `tiers.complex`
 * fixture asks an agent to migrate to a per-tenant schema. Each workspace now
 * has its own override map; DEFAULTS stay shared. Calls that omit the
 * workspace id read and write Parent Co, so single-tenant callers are
 * unchanged.
 */
import { DEFAULT_WORKSPACE_ID, getWorkspace } from './workspaces.js';

const settingsByWorkspace = new Map();

const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

function storeFor(workspaceId) {
  getWorkspace(workspaceId);
  let settings = settingsByWorkspace.get(workspaceId);
  if (!settings) {
    settings = new Map();
    settingsByWorkspace.set(workspaceId, settings);
  }
  return settings;
}

export function getSetting(key, workspaceId = DEFAULT_WORKSPACE_ID) {
  return storeFor(workspaceId).get(key) ?? DEFAULTS[key];
}

export function setSetting(key, value, workspaceId = DEFAULT_WORKSPACE_ID) {
  storeFor(workspaceId).set(key, value);
}

export function allSettings(workspaceId = DEFAULT_WORKSPACE_ID) {
  return { ...DEFAULTS, ...Object.fromEntries(storeFor(workspaceId)) };
}

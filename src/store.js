/**
 * In-memory settings store, scoped per workspace.
 *
 * FIXTURE NOTE: the `tiers.complex` fixture's tenant migration has landed
 * here (TEAM-8, phase 1). Settings are now keyed by workspace id; calls that
 * pass no workspace read and write the Parent Co workspace, so existing
 * callers behave exactly as they did against the old global store. DEFAULTS
 * stays a single shared, hardcoded object — centralising config is a
 * separate fixture ticket. Every write records a `settings.update` audit row.
 */
import { recordAudit } from './audit-log.js';
import { PARENT_CO_ID, getWorkspace } from './workspaces.js';

const settingsByWorkspace = new Map();

const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

function settingsFor(workspaceId) {
  if (!getWorkspace(workspaceId)) throw new Error(`Unknown workspace: ${workspaceId}`);
  let settings = settingsByWorkspace.get(workspaceId);
  if (!settings) {
    settings = new Map();
    settingsByWorkspace.set(workspaceId, settings);
  }
  return settings;
}

export function getSetting(key, workspaceId = PARENT_CO_ID) {
  return settingsFor(workspaceId).get(key) ?? DEFAULTS[key];
}

export function setSetting(key, value, { workspaceId = PARENT_CO_ID, actorEmail = 'system' } = {}) {
  const settings = settingsFor(workspaceId);
  // Audit first: an invalid actor must reject the write, not leave it unaudited.
  recordAudit({ actorEmail, workspaceId, action: 'settings.update', entityId: key });
  settings.set(key, value);
}

export function allSettings(workspaceId = PARENT_CO_ID) {
  return { ...DEFAULTS, ...Object.fromEntries(settingsFor(workspaceId)) };
}

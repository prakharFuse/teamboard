/**
 * In-memory settings store, global by design.
 *
 * FIXTURE NOTE: the `tiers.complex` fixture issue asks an agent to migrate a
 * "legacy global settings store" to a per-tenant schema. This is that legacy
 * store — global keys, no tenant dimension, read and written from one place.
 * Keep it global; the migration is the ticket.
 */
const settings = new Map();

// User-editable, store-backed application settings (string values read through
// getSetting/setSetting), not deployment config — so they stay inline here and
// are not env-overridable. Deployment config lives in src/config.js.
const DEFAULTS = {
  'notifications.enabled': 'true',
  'board.columns': 'todo,doing,done',
  'retention.days': '30',
};

export function getSetting(key) {
  return settings.get(key) ?? DEFAULTS[key];
}

export function setSetting(key, value) {
  settings.set(key, value);
}

export function allSettings() {
  return { ...DEFAULTS, ...Object.fromEntries(settings) };
}

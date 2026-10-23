// @ts-check
/**
 * Single source of truth for deployment configuration.
 *
 * FIXTURE NOTE: this module is the result of the config-audit fixture
 * (`tiers.complex`, "audit hardcoded config + centralise"). The values below
 * used to be scattered magic numbers and strings in src/api-client.js and
 * src/logger.js. DEFAULTS is the compile-time layer; loadConfig() adds the
 * runtime layer by applying validated TEAMBOARD_* environment overrides.
 * Importing this module has no side effects.
 */

/**
 * @typedef {object} ApiConfig
 * @property {string} baseUrl
 * @property {string} region
 * @property {number} timeoutMs
 * @property {number} maxAttempts
 * @property {number} backoffBaseMs
 * @property {number} pageSize
 */

/** @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel */

/**
 * @typedef {object} LogConfig
 * @property {LogLevel} level
 */

/**
 * @typedef {object} Config
 * @property {ApiConfig} api
 * @property {LogConfig} log
 */

export const LOG_LEVELS = Object.freeze(['debug', 'info', 'warn', 'error']);

/** @type {Config} */
export const DEFAULTS = Object.freeze({
  api: Object.freeze({
    baseUrl: 'https://api.teamboard.example.com/v1',
    region: 'us-east-1',
    timeoutMs: 15000,
    maxAttempts: 3,
    backoffBaseMs: 250,
    pageSize: 50,
  }),
  log: Object.freeze({
    level: /** @type {LogLevel} */ ('info'),
  }),
});

/**
 * @param {number} min
 * @param {number} max
 */
function intParser(min, max) {
  return (/** @type {string} */ value) => {
    if (!/^\d+$/.test(value)) return undefined;
    const n = Number(value);
    return n >= min && n <= max ? n : undefined;
  };
}

/** @param {string} value */
function parseUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** @param {string} value */
function parseNonEmpty(value) {
  return value.trim() === '' ? undefined : value;
}

/** @param {string} value */
function parseLogLevel(value) {
  return LOG_LEVELS.includes(value) ? value : undefined;
}

/**
 * Each row maps one environment variable onto one config key. `parse` returns
 * undefined for an invalid value; `expected` is the text used in the error.
 */
const ENV_SCHEMA = [
  { section: 'api', key: 'baseUrl', envVar: 'TEAMBOARD_API_BASE_URL', expected: 'an http or https URL', parse: parseUrl },
  { section: 'api', key: 'region', envVar: 'TEAMBOARD_API_REGION', expected: 'a non-empty string', parse: parseNonEmpty },
  { section: 'api', key: 'timeoutMs', envVar: 'TEAMBOARD_API_TIMEOUT_MS', expected: 'an integer from 1 to 2147483647', parse: intParser(1, 2147483647) },
  { section: 'api', key: 'maxAttempts', envVar: 'TEAMBOARD_API_MAX_ATTEMPTS', expected: 'an integer from 1 to 10', parse: intParser(1, 10) },
  { section: 'api', key: 'backoffBaseMs', envVar: 'TEAMBOARD_API_BACKOFF_BASE_MS', expected: 'an integer from 0 to 60000', parse: intParser(0, 60000) },
  { section: 'api', key: 'pageSize', envVar: 'TEAMBOARD_API_PAGE_SIZE', expected: 'an integer from 1 to 1000', parse: intParser(1, 1000) },
  { section: 'log', key: 'level', envVar: 'TEAMBOARD_LOG_LEVEL', expected: `one of ${LOG_LEVELS.join(', ')}`, parse: parseLogLevel },
];

/**
 * Build the effective config: DEFAULTS overlaid with validated env overrides.
 * Unset and empty variables are ignored; invalid ones throw without echoing
 * the raw value. Neither `env` nor DEFAULTS is mutated.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {Config}
 */
export function loadConfig(env = process.env) {
  /** @type {Record<string, Record<string, unknown>>} */
  const result = { api: { ...DEFAULTS.api }, log: { ...DEFAULTS.log } };
  for (const { section, key, envVar, expected, parse } of ENV_SCHEMA) {
    const raw = env[envVar];
    if (raw === undefined || raw === '') continue;
    const parsed = parse(raw);
    if (parsed === undefined) throw new Error(`${envVar} must be ${expected}`);
    result[section][key] = parsed;
  }
  return /** @type {Config} */ (
    Object.freeze({ api: Object.freeze(result.api), log: Object.freeze(result.log) })
  );
}

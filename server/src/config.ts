import path from 'node:path';

/**
 * Centralised runtime configuration.
 *
 * `defaults` holds the compile-time fallback for every config value. `loadConfig`
 * layers environment-variable overrides on top of those defaults and returns a
 * plain `Config` object; the module also exports an eager `config` singleton built
 * from `process.env` so callers can `import { config } from './config.js'` without
 * re-invoking `loadConfig` themselves.
 *
 * Naming scheme: every override lives under the `TEAMBOARD_` prefix
 * (`TEAMBOARD_PORT`, `TEAMBOARD_HOST`, `TEAMBOARD_DB_PATH`,
 * `TEAMBOARD_CSV_FILENAME`), one env var per `Config` field, upper-snake-cased.
 * `TEAMBOARD_PORT` falls back to the legacy unprefixed `PORT` var (previously read
 * directly in `index.ts`) so existing deployments that only set `PORT` keep working.
 */
export const defaults = {
  port: 4060,
  host: 'localhost',
  dbPath: path.join(process.cwd(), 'data', 'team.db'),
  csvFileName: 'members.csv',
} as const;

export interface Config {
  port: number;
  host: string;
  dbPath: string;
  csvFileName: string;
}

/**
 * Parses a numeric env var, falling back when it's missing, not a number, or not
 * positive (zero/negative ports are never valid).
 */
export function toPort(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: toPort(env.TEAMBOARD_PORT ?? env.PORT, defaults.port),
    host: env.TEAMBOARD_HOST ?? defaults.host,
    dbPath: env.TEAMBOARD_DB_PATH ?? defaults.dbPath,
    csvFileName: env.TEAMBOARD_CSV_FILENAME ?? defaults.csvFileName,
  };
}

export const config = loadConfig();

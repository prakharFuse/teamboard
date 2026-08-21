/**
 * Centralised, typed runtime configuration for the TeamBoard server.
 *
 * Naming scheme: every override is an env var prefixed `TEAMBOARD_`
 * (e.g. `TEAMBOARD_PORT`, `TEAMBOARD_HOST`), matching the field name on
 * `Config` in SCREAMING_SNAKE_CASE. `port` also accepts the legacy bare
 * `PORT` env var (common in hosting platforms) as a fallback so existing
 * deployments keep working. `dbPath` keeps its pre-existing exact name,
 * `TEAMBOARD_DB_PATH`, since tests already depend on it.
 *
 * To add a new config value:
 *   1. Add the field to the `Config` interface below.
 *   2. Add a `get` accessor to `config` that reads it via `envString`/
 *      `envNumber` with a sensible default.
 *   3. Reference `config.<field>` wherever the hardcoded value used to live.
 *
 * Runtime overrides: every value can be overridden without a code change by
 * setting the corresponding env var before the process starts, e.g.
 * `TEAMBOARD_PORT=8080 node dist/server/index.js`. Values are read lazily —
 * on every property access, not just once at import time — so tests can
 * mutate `process.env` after importing this module and still see the
 * override take effect (see `server/src/routes/members.test.ts`).
 */
import path from 'node:path';

function envString(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export interface Config {
  readonly port: number;
  readonly host: string;
  readonly dbPath: string;
  readonly csvFilename: string;
}

export const config: Config = {
  get port(): number {
    return envNumber('TEAMBOARD_PORT', envNumber('PORT', 4060));
  },
  get host(): string {
    return envString('TEAMBOARD_HOST', 'localhost');
  },
  get dbPath(): string {
    return envString('TEAMBOARD_DB_PATH', path.join(process.cwd(), 'data', 'team.db'));
  },
  get csvFilename(): string {
    return envString('TEAMBOARD_CSV_FILENAME', 'members.csv');
  },
};

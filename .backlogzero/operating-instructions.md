# teamboard — Operating Instructions

## Project Nature

- teamboard is fixture content, not a product: a deliberately small Node/ESM CLI used as a planning target for an external journey-test suite. It contains intentional rough edges that specific fixture tickets ask an agent to fix.
- Run the CLI with `npm start -- <command>` (commands: `status`, `tasks`, or `--help`/`-h`).
- Run tests with `npm test`.
- `README.md` claims environment variables are read in `src/config.ts` — that file does not exist anywhere in this repo, no config module exists, and nothing reads environment variables. If a task asks for configuration/env-var support, treat `src/store.js` as the closest existing analogue rather than searching for a config file.

## Fixture Gotchas — Do Not "Clean Up"

Several pieces of code are intentionally imperfect so that a specific fixture ticket has something real to fix. Each is marked with a `FIXTURE NOTE` comment at its source — grep for `FIXTURE NOTE` to find them all. Only touch one of these if the task you were given is the matching ticket; otherwise leave it as-is even if it looks like an obvious drive-by fix:

- "Teambaord" misspelled in the README H1 (`README.md:1`) — fixing it is the entire scope of one ticket; don't fix it opportunistically during unrelated work.
- No `--quiet` flag (`src/index.js` `parseArgs`, `src/logger.js` has `setLevel` but it isn't wired to a flag) — the matching ticket wants a `--quiet` flag added plus a unit test in `test/logger.test.js`.
- Hardcoded, scattered magic numbers/env-dependent strings in `src/api-client.js` (retry count `3`, timeout `15000`, backoff base `250`, page size `50`, base URL, region) — the matching ticket wants these audited and centralized into a config module with env overrides. Don't preemptively centralize these for unrelated tasks.
- Global, non-tenant-scoped settings store in `src/store.js` (a `Map` plus flat `DEFAULTS`) — the matching ticket wants this migrated to a per-tenant schema. Don't add a tenant dimension unless this is the ticket.
- `src/store.js` and `src/logger.js` use module-level mutable state instead of dependency injection — this is intentional given the fixture's small scope; don't refactor to classes/DI unless a task specifically asks for it.

## Code Style

- ESM only: no `require`, no build step, no TypeScript, no bundler. The CLI runs `.js` files directly.
- Use named exports (`export function`, `export const`, `export class`) everywhere; no default exports. `src/index.js` is the one file with no exports — it's the entrypoint and uses top-level `main().catch(...)`.
- Log through `logger` from `src/logger.js` (`logger.debug/info/warn/error`); never use raw `console.*`. The one exception is `printHelp` in `src/index.js`, which writes help text straight to `process.stdout` since it isn't a log line.
- Surface errors via `process.exitCode = 1` plus a `logger.error(...)` call, not `process.exit()`.
- Use classes only where there's real instance state (e.g. `ApiClient` holds `baseUrl`/`region`); everything else should be plain functions over module-level state.

## Testing

- Test runner is Node's built-in `node --test`, invoked via `npm test`. Don't add Jest/Mocha/Vitest or a config file for one.
- Import assertions as `import { strict as assert } from 'node:assert';`.
- Declare tests with `import { test } from 'node:test';` and write one `test('...', () => { ... })` per behavior — a separate test for the rejected case using `assert.throws(fn, /message regex/)` rather than combining cases.
- Tests live in a flat `test/` directory at the repo root, one file per source module (e.g. `test/logger.test.js` ↔ `src/logger.js`). Only `logger.js` has coverage today.

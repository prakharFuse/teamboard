# Teamboard

Teamboard is fixture content, not a production app — a small task-tracking CLI used as the seed repository for a journey-suite test harness that clones/branches/PRs against it. It's a single flat CLI package under `src/`, with no database and no network server of its own (the only outbound network call is `src/api-client.js`'s `ApiClient` hitting an external, hardcoded API base URL via `fetch`).

## Running & Testing

- Entrypoint is `src/index.js` (has a `#!/usr/bin/env node` shebang), wired via `package.json`'s `main`/`start`.
- Run with `npm start -- <command> [--verbose]` or `node src/index.js <command>`.
- Commands: `status` (prints settings from `src/store.js`), `tasks` (fetches page 1 via `ApiClient`), `help`/`-h`.
- `--verbose` raises the logger to `debug` level.
- Run tests with `npm test`, which runs `node --test` (the built-in Node test runner, not Jest/Mocha/Vitest).

## Code Style

- Pure ESM: `package.json` sets `"type": "module"`; use `import`/`export` everywhere, never `require`.
- Zero dependencies: `package.json` declares no `dependencies` or `devDependencies`. Don't add a package without discussing it first.
- Named exports only (`export class ApiClient`, `export function getSetting`, `export const logger`) — no default exports in `src/`.
- Write tests with `node:assert/strict` and `node:test`, one `test('description', () => { ... })` block per behavior, matching the shape of `test/logger.test.js`.

## Known Divergence From README

README.md's Configuration section claims environment variables are read in `src/config.ts`. That file does not exist, and no file under `src/` reads `process.env`. In reality every configurable value (API base URL, region, timeout, retry count, backoff base, page size, default log level, settings defaults) is a hardcoded literal spread across `src/api-client.js`, `src/logger.js`, and `src/store.js`. This is intentional fixture setup, not a bug to fix.

## Fixture Constraints — Do Not "Clean Up" Incidentally

Several things that look like bugs or debt are deliberate setup for specific future tickets, each marked with a `FIXTURE NOTE` comment in the source. Only change one of these if it is the specific task you were given; otherwise leave it as-is:

- README.md's H1 "Teambaord" — deliberate misspelling for an `easy`-tier ticket.
- `src/api-client.js`'s hardcoded, scattered config values (`baseUrl`, `region`, retry count `3`, timeout `15000`ms, backoff base `250`ms, page size `50`) — for a `complex`-tier "audit and centralize config" ticket. Don't consolidate these into a config module or env vars.
- `src/logger.js`'s hardcoded default level (`'info'`) — part of the same config-centralization ticket; leave it inline.
- `src/store.js`'s global (non-tenant) settings `Map` — for a `complex`-tier "migrate to per-tenant schema" ticket. Don't add tenant scoping unless that's the task.
- `src/index.js`'s arg parser plus `src/logger.js`'s level concept — kept together so a `medium`-tier "add a `--quiet` flag" ticket is answerable. Don't preemptively add `--quiet`; if you do add it, add one unit test to `test/logger.test.js`.

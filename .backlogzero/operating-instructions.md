# Teamboard — Agent Operating Instructions

## What this repo is

- Teamboard is a **fixture repository**, not a real product. It exists so an external "journey suite" can clone it, branch it, and open PRs against it while resolving simulated Jira tickets.
- It is a single-process Node CLI with **zero npm dependencies** (no `dependencies` or `devDependencies` in `package.json`). Everything relies on Node built-ins (`fetch`, `node:test`, `node:assert`).
- There is no server, no database, no client/server split, and no routing layer. If a repository map or prior context describes `client/`, `server/`, Express routes, or SQLite, that description is stale or from a different project — trust the actual working tree instead.

## Running and testing

- Run the CLI: `npm start -- --help` (equivalent to `node src/index.js --help`).
- Run tests: `npm test` (equivalent to `node --test`, which auto-discovers `test/**/*.test.js`).
- Tests use Node's built-in `node:test` + `node:assert/strict` — do not add Jest/Mocha/Vitest or any test framework dependency.
- One test file per source module, named `<module>.test.js` under `test/`, importing the module under test via a relative `../src/...` path.
- Keep each `test(...)` block scoped to one behavior; use separate `assert.doesNotThrow` / `assert.throws` tests for success/failure cases rather than combining both into one block.
- Coverage is intentionally sparse (`api-client.js` and `store.js` currently have no tests) — this is by design, not an oversight to backfill unless a task specifically asks for it.

## Don't fix these unless the task explicitly asks for it

This repo deliberately contains rough edges that are the subject of specific fixture tickets elsewhere. Cleaning one up as a side effect of an unrelated change removes that ticket's subject:

- The README title "Teambaord" is misspelled on purpose.
- Config values (base URL, region, retry count, request timeout, backoff base, page size in `src/api-client.js`; default log level in `src/logger.js`) are intentionally scattered rather than centralized — leave them scattered unless the task is specifically about centralizing config.
- `src/index.js` has no `--quiet` flag (only `--verbose`) — don't add one unprompted.
- `src/store.js` is a global, tenant-less settings store — don't migrate it to a per-tenant schema unless asked.

## Stale documentation to ignore

- README.md claims environment variables are read in `src/config.ts`. That file does not exist, and nothing under `src/` reads `process.env`. Don't point work at `src/config.ts`.

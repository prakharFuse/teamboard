# Repository Overview

- Teamboard is a fixture repository, not a real product — it exists so an external "journey suite" can clone it, branch, and open PRs against it while resolving simulated Jira tickets.
- It is a single-process CLI: no server, no database, no client/server split. Everything runs synchronously in one `node` invocation. Ignore any assumption of `client/`, `server/`, SQLite, or Express — those belong to a different project, not this repo.
- Zero real npm dependencies: `package.json` has no `dependencies`/`devDependencies` keys and there is no lockfile. Everything relies on Node built-ins (`fetch`, `node:test`, `node:assert`).

## Commands

- `npm start -- --help` runs `node src/index.js --help`.
- `npm test` runs `node --test`, which discovers `test/**/*.test.js`.
- CLI subcommands are `status`, `tasks`, and `help`. `--verbose` sets the logger to debug level; there is no `--quiet` flag.
- `ApiClient.request()` retries up to 3 times against the upstream API with exponential backoff, logging each retry via `logger.warn`. The upstream host (`api.teamboard.example.com`) is a hardcoded placeholder — no real server exists or is expected behind it.

## Intentional Rough Edges — Do Not "Clean Up"

- IMPORTANT: This repo intentionally contains rough edges that serve as fixture subjects for future tickets — do not silently fix, remove, or backfill them unless that is literally the task given.
- The misspelled README title ("Teambaord") is intentional.
- The missing `--quiet` CLI flag is an intentional gap, not an oversight.
- Sparse test coverage (`api-client.js` and `store.js` have no tests) is intentional — these are fixture subjects, not a backlog to fill unprompted.
- `package.json`'s `pnpm.overrides.path-to-regexp` entries are inert automated security-fix pins for GHSA-37ch-88jc-xwx2 with no real effect, since the repo has no actual dependency tree. Don't treat their presence as evidence of a real dependency graph, and expect similar overrides to reappear for other transitive-dependency CVEs.

## Testing Conventions

- Test runner is Node's built-in `node:test` + `node:assert/strict` — no Jest, Mocha, or Vitest.
- One test file per source module, named `test/<module>.test.js` (e.g. `test/logger.test.js` for `src/logger.js`), importing the module under test via a relative `../src/...` path.
- Each `test(...)` block should cover exactly one behavior; use separate `assert.doesNotThrow` / `assert.throws` blocks for the success and failure cases rather than combining both into one test.

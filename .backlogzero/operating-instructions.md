# Repository Overview

- Teamboard is a **fixture repository** used by an agent-evaluation journey suite, not a real product. Code that looks unfinished, hardcoded, or buggy is usually deliberate bait for a specific evaluation ticket, not an oversight.
- Single-process Node.js CLI, ESM (`"type": "module"`). No database, server, or framework. `src/index.js` is the entrypoint; it is the only module that imports `src/logger.js`, `src/store.js`, and `src/api-client.js`.
- `README.md` claims environment variables are read in `src/config.ts`. That file does not exist and there are no `.ts` files anywhere — this is an intentional divergence (see below), not a stale doc to correct.

# Do Not "Fix" These Without Being Asked

Each item below is the deliberate subject of a specific fixture ticket. Changing it as an unrelated cleanup removes that ticket's subject and invalidates its plan. Before touching `src/index.js`, `src/logger.js`, `src/store.js`, or `src/api-client.js`, check whether the requested task *is* one of these; if not, leave the others untouched.

- `README.md` title "Teambaord" — misspelled on purpose; do not correct it unless that is the actual task.
- `src/store.js` — a global, tenant-less settings `Map`. Keep it global and keep reads/writes centralized in this one file; do not add a tenant dimension speculatively.
- `src/logger.js` — has a level concept but no `--quiet` flag yet. Do not add `--quiet` support unless that is the actual task.
- `src/api-client.js` and `src/logger.js` — hardcoded, scattered config values (API base URL, region, retry count, timeout, backoff formula, page size, default log level). Do not consolidate these into a config module unless that is the actual task.
- The `README.md` reference to a nonexistent `src/config.ts` — do not "fix" the docs by creating that file; the scattered config is itself a fixture ticket's subject.

# Known Non-Obvious Behavior

- The `retention.days` setting is read from `src/store.js` and logged by the `tasks` command, but it is never actually passed into `ApiClient.listTasks`, which always requests `page=1&per_page=50` regardless of that setting.
- `store.js` has no consumers besides `src/index.js`; `setSetting` is exported but currently unused at runtime.

# Testing

- Run tests with `npm test`, which runs `node --test` (Node's built-in test runner — no third-party framework is installed).
- Use `node:assert`'s `strict` import for assertions, not chai/jest/etc.
- Mirror source layout: one `test/<module>.test.js` file per source module, importing directly from `../src/<module>.js` with the `.js` extension included (required since this is an ESM package with no bundler/transpiler).
- Give each behavior (e.g. valid input vs. invalid input) its own `test(...)` block rather than combining multiple assertions into one test.
- There is no mocking library in use; don't introduce one for pure side-effecting module-state code.

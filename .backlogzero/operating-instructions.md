# Teamboard Agent Instructions

## What This Repo Is
- teamboard is a fixture repository for an external test-harness ("journey suite"); tickets simulate Jira issues resolved against this code via clone → plan → branch → PR. It is not a product under active feature development in the usual sense.
- It's a tiny Node.js ESM CLI with no build step: `src/index.js` (entrypoint/arg parser), `src/logger.js` (leveled logger), `src/api-client.js` (fetch-based HTTP client), `src/store.js` (in-memory settings store).
- Ignore README.md's claim that env vars are read in `src/config.ts` — that file does not exist and no code reads `process.env` anywhere. `src/store.js`'s `DEFAULTS`/`getSetting`/`setSetting`/`allSettings` is the actual source of truth for settings.

## Commands
- Run the CLI: `npm start -- <command>` (see `src/index.js` for available commands).
- Run tests: `npm test` (runs `node --test`).
- No linter or formatter is configured — there is no automated style gate beyond matching the conventions already present in the files.

## Do Not "Clean Up" These Intentional Quirks
Several things that look like bugs or debt are deliberately left in place because each is the exact subject of a specific fixture ticket. Fixing one as unrequested cleanup collapses that ticket to a no-op. Leave these alone unless a task explicitly asks for that exact change:
- The "Teambaord" typo in `README.md`'s heading.
- Scattered magic numbers/config in `src/api-client.js` (base URL, region, retry count, timeout, backoff formula, page size) instead of centralized config.
- The global, non-tenant-scoped `Map` in `src/store.js`.
- The absence of a `--quiet` flag in `src/index.js`'s arg parser and the related level-handling in `src/logger.js`.
- A `FIXTURE NOTE` comment in a file's top-of-file block marks exactly this kind of load-bearing quirk — read it before restructuring that file.
- If a task does ask you to implement one of these (e.g. add `--quiet`, centralize config, migrate the store to per-tenant), implement it fully — this rule only blocks unrequested drive-by fixes, not real tickets.

## Code Style
- Plain JavaScript, ESM only (`"type": "module"`) — use `import`/`export` with explicit `.js` extensions on relative imports, never bare extensionless specifiers.
- Use plain module-level bindings for stateful singletons (like `currentLevel` in `src/logger.js`, or the `Map` in `src/store.js`), not classes. Reserve `class` for things with real per-instance state (e.g. `ApiClient`, which holds `baseUrl`/`region` per instance).

## Testing
- Test runner is Node's built-in `node:test` + `node:assert` — no Jest, Mocha, or Vitest.
- One test file per source module, named `test/<module>.test.js`.
- Write one `test()` per behavior — keep a valid-input case and an invalid-input case as separate tests rather than combining assertions.
- Assert exact conditions (e.g. `assert.throws(fn, /Unknown log level/)`), not loose truthy checks.
- When a test is added to satisfy a fixture ticket, add a `FIXTURE NOTE` comment recording which tier it's for, matching the existing convention.
# Teamboard (Fixture Repository)

## What This Repo Is
- This is a fixture repository for BacklogZero's own journey test suite, not a real product — it exists to be cloned, planned against, branched, and have PRs opened on it.
- Zero runtime dependencies, zero devDependencies, no build or transpile step.

## Environment & Commands
- Run the CLI: `npm start -- <command>` (commands: `status`, `tasks`, `help`).
- Run tests: `npm test` (this runs `node --test`).
- Plain ESM JavaScript (`"type": "module"` in package.json) — there is no TypeScript anywhere in this repo and no build step.

## Code Style
- Use `import`/`export` syntax; relative import specifiers must include the `.js` extension (e.g. `from './logger.js'`, not `'./logger'`).
- Default to plain exported functions/module objects. Only introduce a class when a ticket genuinely needs instantiable per-instance state (the way `ApiClient` needs its own `baseUrl`/`region`).
- Throw plain `Error` objects with a short message — don't create custom error classes.
- Each `src/*.js` file opens with a block comment giving a one-line description of the module. Add a `FIXTURE NOTE:` paragraph only when explaining an intentionally-left rough edge (see Fixture Gotchas below); don't add ordinary prose docstrings otherwise.

## Testing
- The test runner is Node's built-in `node:test` plus `node:assert/strict` — there is no Jest/Mocha/Vitest dependency.
- Tests live in a top-level `test/` directory (not colocated with `src/`), one file per source module, named `<module>.test.js`.
- Write flat `test('description', () => { ... })` blocks — no `describe` nesting.
- When adding a test, import only the function(s) under test from the corresponding `../src/<module>.js`, and cover one success case and one failure/invalid-input case as separate `test(...)` blocks.
- Only `test/logger.test.js` exists today; don't assume other modules already have coverage.

## Fixture Gotchas — Do Not "Fix" Unless the Ticket Asks
- The "Teambaord" spelling in README.md's heading is intentionally wrong — it's the entire subject of a dedicated fixture ticket. Don't correct it as an unrequested drive-by fix.
- The scattered hardcoded values in `src/api-client.js` (upstream URL, region, retry count, timeout, backoff formula, page size) are deliberately left as magic values spread across the file — a specific ticket exists to audit and centralize them. Leave them as-is otherwise.
- `src/store.js` is deliberately a single global, tenant-less settings store — a specific ticket migrates it to a per-tenant schema. Don't add a tenant dimension speculatively.
- There is no `--quiet` flag in `src/index.js`/`src/logger.js` — the logging-level plumbing and arg parser already exist specifically so a future ticket can add that flag, with its test expected to land in `test/logger.test.js`.
- README.md's Configuration section references a `src/config.ts` file — this file does not exist and no environment-variable reads exist in `src/`. Treat that README line as stale, not as a pointer to real code.
- If a ticket is specifically about one of the rough edges above, implement it fully. For unrelated tickets, touch these files normally but don't "clean up" these specific smells as a side effect.

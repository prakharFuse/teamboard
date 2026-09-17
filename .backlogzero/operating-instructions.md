# Repository Overview

- Teamboard is a fixture repository backing an automated "journey suite," not a real deployed product. It gets reconciled from an external seed pack outside this checkout; edits made directly here can be overwritten on the next reseed.
- There is no client/, server/, database, or `src/config.ts` in this repo — re-derive structure from the filesystem (`find`/`Read`) rather than trusting any cached index or prior description.
- Pure ESM Node CLI: `package.json` sets `"type": "module"`, has no dependencies/devDependencies, no lockfile, and no lint/formatter/tsconfig config anywhere.
- `ApiClient` (`src/api-client.js`) is an outbound-only caller to a hardcoded upstream URL — there is no HTTP server in this repo to receive those calls or to run/mock locally.

# Running & Testing

- Run the CLI with `npm start -- <command>` (commands: `status`, `tasks`, `help`; default is `status`). Only `--verbose` and `-h`/`--help` flags exist today.
- Always include the `--` separator when passing flags through npm, e.g. `npm start -- --help`. Without it (`npm start --help`), the flag goes to npm itself, not the CLI.
- `npm install` is a no-op here (no dependencies) — skip it, and don't treat a missing `node_modules/` as a failure.
- Run tests with `npm test` (runs `node --test`, which discovers `test/logger.test.js`).

# Gotchas

- README.md claims env vars are read from `src/config.ts` — that file does not exist and nothing under `src/` reads `process.env`. All configuration (ApiClient's base URL/region/retry/timeout/page-size, `store.js`'s `DEFAULTS`) is hardcoded.
- `ApiClient.request` retries silently and only rethrows the final attempt's error — the original `AbortError`/HTTP error from earlier attempts is swallowed, so a caller never sees the first failure.
- `store.js` settings are never passed into `ApiClient` — settings flow one-way from `index.js` downward; e.g. `getSetting('retention.days')` is read only to log it.
- `logger.js` is shared by both the CLI and `ApiClient`'s retry-warning output, so changes to logging behavior affect both call sites.

# Fixture Rough Edges — Leave Alone Unless a Ticket Asks

Each affected file carries a `FIXTURE NOTE` doc comment naming the ticket it exists to support — check those before assuming something below is a bug to clean up:

- README.md's "Teambaord" heading typo — fix only if a ticket specifically asks for that typo.
- `logger.js` has level support but no `--quiet` CLI flag — only add one (wired into `src/index.js`'s `parseArgs`), plus one unit test in `test/logger.test.js`, if a ticket asks for it.
- `api-client.js`'s scattered magic numbers (retry count, timeout, backoff base, page size, base URL, region) are intentional — don't consolidate into config unless a ticket asks for exactly that audit.
- `store.js`'s global, tenant-less settings `Map` is intentional — don't migrate to a per-tenant schema unless ticketed.
- Anything not listed above (real bugs, missing error handling, genuinely broken behavior) is fair game to fix.

# Code Style

- ESM only: `import`/`export` with `.js` extensions on relative imports, never `require`.
- One class or one set of functions per file, using named exports (no default exports).
- Each file opens with a single file-level `/** ... */` doc comment describing its purpose; don't add per-function JSDoc blocks.
- Throw plain `Error` objects with template-string messages; no custom error classes.
- Log through the shared `logger` (`logger.debug/info/warn/error`) with an optional `meta` object as the second argument — never `console.*`.

# Testing Conventions

- Use `node:test` and `node:assert/strict`, with one `test()` per behavior.
- Name test files `<module>.test.js` under `test/`, mirroring the `src/<module>.js` they cover.
- For validation-style behavior, use `assert.doesNotThrow`/`assert.throws` with a message regex, matching the existing `test/logger.test.js` pattern.

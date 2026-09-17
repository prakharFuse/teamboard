# Repository Overview

- teamboard is a fixture repository, not a real product: it exists so an external test/journey suite has a small, real Node.js codebase to clone, plan against, and open PRs on (see `README.md`).
- Despite the README's own title ("Journey suite fixture: a small task-tracking service"), there is no server, no client, no HTTP API, and no database in this repo. It is a single-package Node.js CLI (`src/index.js`, `src/logger.js`, `src/api-client.js`, `src/store.js`).
- `src/api-client.js` calls an external, upstream host (`api.teamboard.example.com`) that lives outside this repo. There is nothing to run locally to serve it — don't go looking for a local server or try to stand one up.
- The README claims env vars are read in `src/config.ts`. That file does not exist anywhere in the tree — the repo is plain `.js` throughout with no `.ts` files and no `process.env` reads in `src/`. If asked to centralize config, create `src/config.ts` (or equivalent) fresh; do not assume it already exists.

## Intentional rough edges — do not fix opportunistically

Several parts of the code are deliberately rough, each called out with a `FIXTURE NOTE` comment in the source, and each is the deliberate subject of a separate test ticket. Leave these as-is unless a task explicitly asks you to change that exact thing:

- `README.md` title spelling ("Teambaord") is intentionally misspelled.
- Magic numbers/strings in `src/api-client.js` (hardcoded `baseUrl`, `region`, retry count `3`, timeout `15000`, backoff base `250`, page size `50`) are scattered on purpose as the subject of a config-centralization ticket.
- `src/store.js`'s global (non-tenant-scoped) settings `Map` is the deliberate subject of a "migrate to per-tenant schema" ticket.
- The absence of a `--quiet` flag in `src/index.js`'s arg parser is the subject of another ticket (paired with a unit test landing in `test/logger.test.js`).

If asked to work on one of these specific tickets, read the `FIXTURE NOTE` comment in the relevant file first — it states the expected shape of the fix.

# Commands

- Run the CLI: `npm start -- <command>`
- Run tests: `npm test` (plain `node --test`, no test framework dependency)

# Code Style

- Plain `.js`, ESM only (`"type": "module"` in `package.json`). No TypeScript, no build step, no bundler.
- Local imports must use explicit `.js` extensions (e.g. `import { logger } from './logger.js';`) — required by Node's native ESM resolution; don't drop the extension on new local imports.
- No third-party runtime dependencies exist yet. Adding one is a real, visible change to `package.json` — don't add a library for something the standard library already covers (`fetch`, `node:test`, `node:assert` are already in use).
- Favor minimal comments. Only add a short one-line clarification where the code itself doesn't explain why.
- Every source file with a `FIXTURE NOTE` comment explains why something looks wrong on purpose. Read it before changing surrounding code, and never delete or edit one as part of an unrelated change — only touch it when a task explicitly resolves the exact thing it describes.

# Testing

- Test runner is Node's built-in `node:test`, not Jest/Mocha/Vitest.
- Assertions use `node:assert`'s strict mode: `import { strict as assert } from 'node:assert';`.
- One test file per source module, mirroring the name (`src/logger.js` → `test/logger.test.js`, `src/store.js` → `test/store.test.js`).
- Pair a success case with a failure case for each behavior (e.g. `setLevel accepts a known level` alongside `setLevel rejects an unknown level` via `assert.throws` with a message-matching regex) rather than testing only the happy path.
- `src/api-client.js` (calls a real external host via `fetch`) and `src/index.js`'s `parseArgs`/`printHelp` have no existing tests and no established mocking convention. If adding behavior there, pick the simplest approach that avoids a real network call — e.g. inject a fake `fetch`, or test pure functions like `parseArgs` directly without invoking `main()`.
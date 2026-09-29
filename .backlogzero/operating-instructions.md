# Project Overview

- This repo is a BacklogZero journey-suite fixture: a small task-tracking CLI, not a real product. It's kept deliberately small-but-imperfect so journey fixtures have real audit/extend targets to work against.
- Plain Node.js ESM (`"type": "module"` in package.json). No build step, no external runtime dependencies.
- Entry point is `src/index.js`, run via `npm start`.

# Running & Testing

- Run tests with `npm test`, which invokes Node's built-in runner (`node --test`) — there is no third-party test framework.
- Test files live flat under `test/` as `*.test.js` and import source via relative ESM paths (e.g. `import { setLevel } from '../src/logger.js'`).
- Assertions use `node:assert`'s strict API (`assert.doesNotThrow`, `assert.throws`), not a third-party assertion library.
- Only `test/logger.test.js` exists today; add new tests in the same flat-file, strict-assert style rather than introducing a new framework or directory layout.
- Reseed fixture content with `pnpm test:journey provision-repo` (see README for details).

# Do Not "Fix" These Fixture Invariants

IMPORTANT: The items below are intentional fixture rough edges, each the deliberate subject of a specific journey-suite tier — do not clean them up as drive-by improvements even though they look like bugs or tech debt.

- The "Teambaord" typo in README.md's H1 is the subject of the `tiers.easy` fixture (correcting it to "Teamboard"); fixing it by hand makes that tier's plan vacuous.
- The magic numbers and env-dependent strings scattered in `src/api-client.js` (retry count `3`, timeout `15000`, backoff base `250 * 2 ** attempt`, `per_page=50`, `baseUrl`, `region`) are the subject of a `tiers.complex` "audit and centralize config" fixture. Do not consolidate them into a config module.
- The global, tenant-less settings store in `src/store.js` (`const settings = new Map()`, no tenant key) is the subject of a `tiers.complex` "migrate to per-tenant schema" fixture. Keep it global.
- The hardcoded default log level (`let currentLevel = 'info'`) in `src/logger.js` is one of the values the config-centralization fixture expects to find — don't extract it preemptively.
- There is intentionally no `--quiet` CLI flag; `src/index.js`'s arg parser and `src/logger.js`'s level concept exist so the `tiers.medium` "add `--quiet`" fixture is answerable. Only add it when actually implementing that ticket, and land its test in `test/logger.test.js`.

# Known Documentation Divergence

- README's Configuration section claims env vars are read in `src/config.ts`. That file does not exist, there is no `.ts` file anywhere in the repo, and no source file reads `process.env`. Treat that section of the README as stale — don't create `src/config.ts` to match it; the config values it would describe are intentionally left uncentralized (see fixture invariants above).
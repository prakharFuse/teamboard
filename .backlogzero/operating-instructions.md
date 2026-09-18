# Repository Overview

- This is fixture content for an external journey/test-suite, not a product under active development. It's a small Node CLI (`teamboard`) with no client/server split and no database.
- Single-process Node CLI. `src/index.js` is the only entrypoint; commands are `status`, `tasks`, `help`.
- Four files make up the whole app: `src/index.js` (CLI entry), `src/logger.js` (levelled logger), `src/store.js` (in-memory, process-global settings store), `src/api-client.js` (fetch-based HTTP client for a fake upstream task API with hand-rolled retry/backoff).
- `ApiClient` is instantiated fresh per `tasks` command invocation — it is not a singleton and holds no state beyond `baseUrl`/`region`.
- `store.js`'s settings map is module-level and process-global — treat it as a singleton for the CLI's lifetime.
- `logger.js` chooses stdout vs stderr per call based on level (`warn`/`error` → stderr, `debug`/`info` → stdout), not on any config.
- The README's "Configuration" section pointing to `src/config.ts` is stale: that file does not exist, and no source file reads `process.env` anywhere in the repo. There is currently no environment-variable configuration surface.

# Coding Style

- Plain ESM JavaScript (`"type": "module"` in `package.json`) — no TypeScript, no bundler, no transpile step.
- Use `.js` extensions on relative imports (e.g. `from './logger.js'`).
- Zero runtime dependencies by design — `package.json` has no `dependencies`/`devDependencies` block. Use platform-native APIs (e.g. global `fetch`/`AbortController`) instead of adding a library like axios.
- Export plain functions/classes, not default exports (e.g. `export class ApiClient`, `export function getSetting`, `export const logger`).
- CLI argument parsing (`src/index.js:parseArgs`) is a hand-rolled loop, not a library — follow that pattern for new flags rather than introducing a CLI-parsing dependency.
- Doc comments are used sparingly. Files with deliberately imperfect code for fixture purposes mark it with a `FIXTURE NOTE:` block comment at the top of the file or inline next to the specific line.

# Testing

- Run tests with `npm test` (Node's built-in test runner: `"test": "node --test"`). No Jest/Mocha/Vitest.
- Use `node:assert`'s strict import (`import { strict as assert } from 'node:assert'`) for assertions, not a third-party assertion library.
- Test files live under `test/` and are named `<module>.test.js`, matching the `src/<module>.js` they cover.
- Give each behavior its own `test(...)` block rather than bundling multiple assertions into one test.

# Fixture Gotchas — Do Not "Fix" These Opportunistically

- IMPORTANT: Every source file carries a `FIXTURE NOTE` identifying a deliberate flaw that is the subject of some other ticket — if asked to do unrelated work in one of these files, do not clean up the flaw as a drive-by, since that silently breaks the other ticket. Only touch these when the task is specifically that ticket.
- `README.md` heading "Teambaord" is misspelled on purpose (subject of the `tiers.easy` fixture issue) — do not correct it unless a ticket explicitly asks for the rename.
- `src/api-client.js`'s hardcoded `baseUrl`, `region`, retry count (`3`), timeout (`15000`), backoff base (`250 * 2 ** attempt`), and page size (`per_page=50`) are scattered on purpose for the `tiers.complex` config-centralization fixture — only refactor these if the ticket is specifically about config centralization.
- `src/logger.js`'s level machinery (`LEVELS`, `currentLevel`) exists so a `--quiet` flag is implementable end-to-end (the `tiers.medium` fixture) — don't remove or restructure it incidentally.
- `src/store.js`'s global (non-tenant-scoped) settings store is deliberate — the `tiers.complex` fixture asks for a per-tenant migration; keep it global unless that's the ticket.
- `test/logger.test.js` is a placeholder for the "one unit test" the `--quiet`/`tiers.medium` fixture expects to land here; it currently only tests `setLevel`, not quiet-mode suppression — don't expand it unless doing that ticket.

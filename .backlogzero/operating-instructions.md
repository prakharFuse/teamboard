# Repository Purpose

- Teamboard is a fixture repo built for BacklogZero's journey test suite, not a real product — treat "incomplete" or "half-finished" looking code as deliberate unless told otherwise.
- IMPORTANT: Several files carry inline `FIXTURE NOTE:` comments marking gaps that are intentional and reserved for specific future tickets. Grep for `FIXTURE NOTE` before doing any general refactor or cleanup pass, and only close a gap if the task you were given is the one the note names.

## Known intentional gaps (do not "fix" unless assigned)

- `src/store.js`: the module-level `Map` singleton and flat (non-tenant) `DEFAULTS` object are reserved for a future "migrate to per-tenant schema" ticket — don't add namespacing/tenancy speculatively.
- `src/api-client.js`: the hardcoded `baseUrl`, `region`, retry count, timeout, backoff formula, and page size are reserved for a future "centralise hardcoded config" ticket — don't extract these into a config module unless that's the assigned task.
- `src/logger.js` / `src/index.js`: there is intentionally no `--quiet` flag yet, reserved for a future ticket.
- `README.md`'s misspelled heading ("Teambaord") is intentional, reserved for a typo-fix ticket — don't correct it unless that's the assigned task.
- If you are assigned one of these tickets directly, the note is confirmation the surrounding code was already shaped to make it answerable — implement it there rather than restructuring further.

## Environment quirks

- No build step: the CLI runs directly from `src/` via `node` (`package.json` declares `"type": "module"`); there is no bundler, TypeScript compile step, or `dist/`.
- Zero npm dependencies — `package-lock.json` exists but declares no packages, and there is no `node_modules/`.
- `README.md` is out of date on configuration: it points to `src/config.ts`, but no `.ts` file exists anywhere and no code reads `process.env`. The real config surface is `src/store.js`'s `DEFAULTS` object plus the hardcoded literals in `src/api-client.js`'s constructor.

## Testing

- Run tests with `npm test`, which runs `node --test` (Node's built-in test runner — no Jest/Mocha/Vitest).
- One test file per source module, named `test/<module-name>.test.js` to mirror the `src/` filename it covers; extend that file for new coverage of the same module rather than scattering assertions elsewhere or adding a new test framework.
- Import the runner primitives directly (`import { strict as assert } from 'node:assert'; import { test } from 'node:test';`) and import only the named exports under test, not the whole module.
- Write one `test(...)` block per behavior, named as a plain-English sentence, covering both valid and invalid/edge-case input.
- `store.js`, `index.js`, and `api-client.js`'s async `request()` have no tests yet; when adding them, use `node:test` idioms such as `mock.fn`/`mock.method` rather than introducing a new framework.
- Group related tests under `// Step N:` banner comments instead of nested `describe()` blocks, for lightweight documentation of test grouping.

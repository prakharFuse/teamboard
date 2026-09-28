# Repository Purpose

- Teamboard is a deliberately small fixture repo for BacklogZero's journey test suite, not a real product — treat it as a stable, minimal target to clone/plan against/open PRs on, not something to grow.
- The entire runtime is 4 files in `src/` totaling ~120 lines. There is no build step, no bundler, and no `dist/` — `package.json` declares `"type": "module"` and Node runs `src/index.js` directly.
- The project has zero npm dependencies: no `node_modules/`, no `dependencies`/`devDependencies` block in `package.json`.

# FIXTURE NOTE comments mark intentional gaps — don't fix without a matching ticket

- Grep for `FIXTURE NOTE` before doing any general refactor or cleanup pass. These comments mark gaps left on purpose because a specific, separate ticket expects to find and close that exact gap.
- `src/store.js`'s module-level `Map` singleton and flat (non-tenant) `DEFAULTS` are intentional — they're the subject of a future "migrate to per-tenant schema" ticket. Don't add namespacing/tenancy speculatively.
- `src/api-client.js`'s hardcoded `baseUrl`, `region`, retry count (`3`), timeout (`15000`), backoff formula (`250 * 2 ** attempt`), and page size (`50`) are intentional — they're the subject of a future "centralise hardcoded config" ticket. Don't extract these into a config module unless that's the assigned task.
- The `--quiet` flag is intentionally unimplemented in `src/index.js`'s arg parser (only `--verbose`, `--help`/`-h`, and a positional command exist) — don't add it unless that's the assigned task.
- `README.md`'s "Teambaord" heading typo is intentional — don't correct it unless that's the assigned task.
- If you are assigned one of these gaps directly, implement it in place; the surrounding code was already shaped to make it answerable without further restructuring.

# README vs. code divergence — trust the code

- `README.md` claims env vars are read in `src/config.ts`. That file does not exist anywhere in the repo, and no code reads `process.env` at all. The real config surface is `src/store.js`'s `DEFAULTS` object and the hardcoded literals in `src/api-client.js`'s constructor — there is no env-based config layer.

# Testing

- Run tests with `npm test`, which runs `node --test` — Node's built-in test runner. Do not introduce Jest/Mocha/Vitest.
- One test file per `src/` module, named `test/<module-name>.test.js` (mirrors the filename it covers).
- Import only the named exports under test (e.g. `import { setLevel } from '../src/logger.js'`), not the whole module; import runner primitives directly (`import { strict as assert } from 'node:assert'; import { test } from 'node:test';`).
- One `test(...)` block per behavior, named as a plain-English sentence (e.g. `'setLevel accepts a known level'`), covering both a valid and an invalid input case.
- New tests for a `FIXTURE NOTE` gap (e.g. the `--quiet` flag) should extend the existing test file for that module rather than scattering assertions across new files.
- There's no existing precedent for testing async behavior (`ApiClient.request`) or process-level I/O (`index.js`'s `main()`) — use `node:test`'s `mock.fn`/`mock.method` for those rather than adding a new test framework dependency.

# Gotchas

- `ApiClient` imports the logger directly rather than receiving it injected, so all retry/backoff logging flows through the same global logger singleton the CLI configures via `setLevel` — mocking/injecting a separate logger instance won't intercept it.
- `ApiClient` is only constructed inside the `tasks` command branch of `main()`; the `status` and `help` commands never touch the network.

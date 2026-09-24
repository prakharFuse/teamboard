# Repository Context

- This is a fixture repository for an agent/journey test suite, not a production product — it simulates a small task-tracking CLI just well enough for tickets to plan against.
- There is no lint config, no CI config, and no dependencies (`package-lock.json` has zero entries). Don't assume a linter or CI pipeline exists.
- Native ESM only: `package.json` declares `"type": "module"`. There is no TypeScript and no build/transpile step — `.js` files run directly under Node.

# Commands

- Run the CLI: `npm start` (runs `src/index.js`).
- Run tests: `npm test` (this is Node's built-in `node --test` runner, not jest/mocha).

# Code Style

- Use `import`/`export`; no `require`.
- Prefer named exports of plain functions, or a single exported class, over `export default` — no file in `src/` uses a default export.
- Never use raw `console.log` for user-facing or diagnostic output — always go through `src/logger.js`'s `logger` object (`logger.debug/info/warn/error`). `warn`/`error` write to stderr; `debug`/`info` write to stdout, and level filtering is controlled process-wide via `setLevel`.
- For async entrypoints, follow the existing `main().catch(...)` pattern: catch errors at the top level, log them with `logger.error`, and set `process.exitCode` instead of calling `process.exit()` directly.
- Comments prefixed `FIXTURE NOTE` mark intentional rough edges for the test suite — they are not TODOs, do not resolve them incidentally.

# Testing

- Use `node:assert`'s strict export (`import { strict as assert } from 'node:assert'`), not chai/jest matchers.
- Test files live in `test/`, named `<module>.test.js` to mirror the `src/<module>.js` they cover.
- Write one `test(...)` block per behavior/equivalence class (e.g. split accept-known-value and reject-unknown-value into separate blocks) rather than asserting multiple behaviors in one block.
- Only `logger.js` currently has test coverage; `api-client.js` and `store.js` have none.

# Known Divergence and Gotchas

- `README.md` claims environment variables are read in `src/config.ts`. This file does not exist and no code anywhere reads `process.env`. Trust the code, not the README, for configuration behavior — there is currently no environment-variable configuration surface in this repo.
- Several pieces of code look like obvious cleanup targets but are intentionally left as-is because a fixture ticket's answerability depends on them staying broken. Do not "helpfully" fix any of these unless the task at hand is literally that fix:
  - The "Teambaord" misspelling in `README.md:1`.
  - Hardcoded/scattered config values in `src/api-client.js` (`baseUrl`, `region`, retry count, timeout, backoff base, page size) instead of centralized config.
  - The global settings store in `src/store.js` — a single process-wide `Map` with no tenant dimension, marked "legacy" in its own comment.
  - The absence of a `--quiet` flag in `src/index.js`'s `parseArgs` and in `src/logger.js`.
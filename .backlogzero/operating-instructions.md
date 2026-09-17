# Repository Overview

- Teamboard is a fixture repository for an external journey-testing suite, not a product — see README.md for the full statement of intent and re-seeding provenance.
- Single small Node.js CLI, plain ESM JavaScript, no build step, no TypeScript, no database, no client/server split.
- Entry point is src/index.js (run via `npm start`); tests run via Node's built-in test runner (`npm test` → `node --test`).
- It's one process: src/index.js parses args and calls into src/logger.js (logging), src/store.js (in-memory settings), and src/api-client.js (`ApiClient`, the only module that talks to the network, hitting an external hardcoded task API).

# FIXTURE NOTE Comments — Read Before "Cleaning Up" Anything

- IMPORTANT: every source file carries a `FIXTURE NOTE` comment marking code that looks rough on purpose so an external test suite has something concrete to ask an agent to fix — treat these as intent, not tech debt, and never "fix" them as a drive-by unless a ticket specifically asks for that exact change.
- README.md:1 misspells "Teambaord" — this is the subject of the `tiers.easy` ticket; do not fix it unprompted.
- src/api-client.js:15-43 hardcodes the base URL, region string, retry count (3), per-attempt timeout (15000ms), backoff base (250ms), and page size (50) — subject of the `tiers.complex` "audit and centralize config" ticket.
- src/logger.js:13 hardcodes `currentLevel` to `'info'` — part of the same config-centralization fixture.
- src/store.js is a global `Map`-backed settings store with no per-tenant dimension — subject of a `tiers.complex` "migrate to per-tenant schema" ticket.
- No `--quiet` flag exists in src/logger.js / src/index.js's arg parser yet — subject of the `tiers.medium` ticket to add `--quiet` for suppressing info-level output, backed by one unit test in test/logger.test.js.
- README.md:32 claims env vars are read in `src/config.ts` — that file does not exist, and no file under src/ reads `process.env`; settings only come from the hardcoded `DEFAULTS` map in src/store.js. Don't create `src/config.ts` to match the README — only build it if a ticket explicitly asks to centralize config.

# Code Style

- Plain ESM (`"type": "module"`), no TypeScript, no bundler, no transpile step.
- No lint/format config exists (no `.eslintrc`, no `.prettierrc`) — match the surrounding file's style: 2-space indent, single quotes, semicolons, trailing commas in multiline literals.
- Use classes only when there's real state/behavior to encapsulate (e.g. `ApiClient`); otherwise write plain exported functions.
- Always log through `logger` from src/logger.js (`.debug/.info/.warn/.error`), never raw `console.*` — `warn`/`error` go to stderr, everything else to stdout.

# Testing

- Test runner is Node's built-in `node:test` + `node:assert/strict` (`npm test` → `node --test`) — no Jest/Mocha/Vitest.
- One test file per source module under test/, named `<module>.test.js` (e.g. test/logger.test.js for src/logger.js), importing the module under test with a relative `../src/...` path.
- Write one `test(...)` block per behavior (e.g. one for the accept case, one for the reject case) rather than combining assertions into a single block.
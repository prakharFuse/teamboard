---
name: code-style
description: Module system, style, and test conventions inferred from the four source files
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- Plain ESM JavaScript (`"type": "module"` in package.json), no TypeScript,
  no bundler, no transpile step. Files use `.js` and native `import`/`export`.
- No lint or format config exists in the repo (no `.eslintrc`, no
  `.prettierrc`) — match the existing file's style (2-space indent, single
  quotes, semicolons, trailing commas in multiline literals).
- Classes only where there's real state/behavior to encapsulate
  (`ApiClient` in src/api-client.js); everything else is plain exported
  functions (`src/logger.js`, `src/store.js`).
- Logging goes through `logger` from src/logger.js (`.debug/.info/.warn/.error`),
  never raw `console.*` — `warn`/`error` write to stderr, everything else to
  stdout (see the `stream` selection in `emit()`).

## Testing

- Test runner is Node's built-in `node:test` + `node:assert/strict`
  (`npm test` → `node --test`) — no Jest/Mocha/Vitest dependency.
- Test files live under `test/`, one file per source module, named
  `<module>.test.js` (e.g. `test/logger.test.js` for `src/logger.js`).
  Only `logger.js` has a test file today; `index.js`, `api-client.js`, and
  `store.js` are currently untested.
- Each `test/*.test.js` imports the module under test with a relative `../src/...`
  path and writes one `test(...)` block per behavior (see
  test/logger.test.js: one test for the accept case, one for the reject
  case) rather than combining assertions into a single test block.

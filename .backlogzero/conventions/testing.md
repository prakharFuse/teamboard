---
name: testing
description: How tests are written and run for teamboard — node:test, file layout, assertion style
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- Test runner is Node's built-in `node:test` (invoked via `npm test` → `node --test`), not Jest/Mocha/Vitest. No test framework is a dependency.
- Assertions use `node:assert`'s `strict` mode: `import { strict as assert } from 'node:assert';`.
- One test file per source module, mirroring the name: `src/logger.js` → `test/logger.test.js`. Follow this pairing when adding tests for a new or modified module (e.g. a test for `src/store.js` would be `test/store.test.js`).
- Each `test(...)` block covers one behavior; the existing file pairs a success case (`setLevel accepts a known level`) with a failure case (`setLevel rejects an unknown level`, asserted via `assert.throws` with a message-matching regex) — follow that valid/invalid pairing rather than testing only the happy path.
- No test currently exercises `src/api-client.js` (it calls a real external host via `fetch` with no injected transport) or `src/index.js`'s `parseArgs`/`printHelp`. If a task adds behavior there, there's no existing mocking convention to match — pick the simplest approach that avoids a real network call (e.g. passing a fake `fetch` or testing pure functions like `parseArgs` directly without invoking `main()`).

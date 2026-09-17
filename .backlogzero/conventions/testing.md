---
name: testing
description: How tests are structured and run in teamboard — node:test, one file per src module, colocated by name
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- Test runner is Node's built-in `node:test` + `node:assert/strict` — no Jest/Mocha/Vitest,
  no test dependency in `package.json` at all. Run via `npm test`, which is `node --test`.
- Tests live in a top-level `test/` directory (not colocated with `src/`), one file per
  `src/` module, named `<module>.test.js` — e.g. `test/logger.test.js` covers
  `src/logger.js`. There is currently only one such file; `src/api-client.js`,
  `src/store.js`, and `src/index.js` have no tests yet, so don't infer a "one test file
  per module" rule as already-satisfied — only `logger.js` actually has one.
- Test style: flat `test('description', () => { ... })` blocks (no `describe` nesting),
  imported directly from `node:test`; assertions via `assert.doesNotThrow` /
  `assert.throws` / equality helpers from `node:assert/strict`.
- New tests for a fixture ticket should follow the pattern in `test/logger.test.js`:
  import only the function(s) under test from `../src/<module>.js`, cover one
  success case and one failure/invalid-input case as separate `test(...)` blocks.

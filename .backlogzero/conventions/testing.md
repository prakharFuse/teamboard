---
name: testing
description: How tests are structured and run in this repo — Node's built-in test runner, no framework deps
type: convention
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- Test runner is Node's built-in `node:test` + `node:assert/strict` — no
  Jest/Mocha/Vitest dependency. `npm test` runs `node --test`, which
  discovers `test/**/*.test.js` by convention.
- One test file per source module, named `<module>.test.js` under `test/`
  (e.g. `test/logger.test.js` tests `src/logger.js`). Import the module under
  test with a relative `../src/...` path.
- Each `test(...)` block covers one behavior; use `assert.doesNotThrow` /
  `assert.throws` for the success/failure pair rather than combining both
  into one test block (see `test/logger.test.js` for the pattern: one test
  for the accepted case, one for the rejected case).
- Coverage is intentionally sparse — `api-client.js` and `store.js` have no
  tests yet. That's by design (see [[fixture-gotchas]]): they're fixture
  subjects for future tickets, not an oversight to backfill unprompted.

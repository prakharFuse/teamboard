---
name: testing
description: How tests are written and run in teamboard
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

- Test runner is Node's built-in `node:test` + `node:assert` — no Jest,
  Mocha, or Vitest installed. Run with `npm test` (→ `node --test`).
- Tests live under `test/`, one file per source module (`test/logger.test.js`
  covers `src/logger.js`). Follow that pairing for new test files
  (`test/<module>.test.js`).
- Each `test(...)` block covers one behavior; a valid-input case and an
  invalid-input case are written as separate `test()` calls, not combined
  into one with multiple unrelated assertions (see `test/logger.test.js`:
  "accepts a known level" vs. "rejects an unknown level" as two tests).
- Assert exact conditions (`assert.throws(fn, /Unknown log level/)`), not
  loose truthy checks.
- `FIXTURE NOTE` comments in test files record which fixture tier a test was
  added for — keep that convention when adding tests driven by a fixture
  ticket (see [[fixture-gotchas]]).

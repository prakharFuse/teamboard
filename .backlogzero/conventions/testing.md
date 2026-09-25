---
name: testing
description: How tests are structured and run in this repo — node:test, one file per module
type: convention
scope: global
updated: 2026-09-24 (IONE-959)
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

Tests use Node's built-in test runner, not an external framework:

- Run with `npm test`, which is `node --test` (see `package.json`).
- Assertions come from `node:assert`'s `strict` export
  (`import { strict as assert } from 'node:assert'`), not chai/jest matchers.
- Test files live in `test/`, named `<module>.test.js` mirroring the
  `src/<module>.js` they cover (e.g. `test/logger.test.js` tests
  `src/logger.js`).
- Each `test(...)` block covers one behavior; `test/logger.test.js` has two
  separate blocks for `setLevel`'s accept-known-level and
  reject-unknown-level paths rather than asserting both in one block — follow
  that split (one `test()` per behavior/equivalence class) for new tests.
- Only `logger.js` has coverage today; `api-client.js` and `store.js` have no
  tests in the current tree.

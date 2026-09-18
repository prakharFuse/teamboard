---
name: testing
description: How tests are written and run in this repo — Node's built-in test runner, no framework
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

- Tests run via Node's built-in test runner: `"test": "node --test"` in
  `package.json` (no Jest/Mocha/Vitest). Run with `npm test`.
- Assertions use `node:assert`'s `strict` import (`import { strict as
  assert } from 'node:assert'`), not a third-party assertion library.
- Test files live under `test/` and are named `<module>.test.js`, matching
  the `src/<module>.js` they cover (currently only `test/logger.test.js` ↔
  `src/logger.js` — `store.js`, `api-client.js`, and `index.js` have no
  tests yet).
- Each behavior gets its own `test(...)` block rather than multiple
  assertions bundled into one — see `test/logger.test.js`'s two separate
  tests for the accept/reject cases of `setLevel`.

---
name: testing
description: Test runner, file layout, and assertion style used in this repo
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

- Runner: Node's built-in `node --test` (via `npm test`), invoked as
  `"test": "node --test"` in `package.json`. No Jest/Mocha/Vitest — don't add
  one or a config file for it.
- Assertions: `node:assert`'s `strict` import, aliased `assert`:
  `import { strict as assert } from 'node:assert';`.
- Test declaration: `import { test } from 'node:test';`, one `test('...', () => { ... })`
  per behavior — see `test/logger.test.js` for the pattern (one test for the
  accepted case, a separate test for the rejected case using
  `assert.throws(fn, /message regex/)`).
- Location: flat `test/` directory at the repo root, one file per source
  module (`test/logger.test.js` ↔ `src/logger.js`). Only `logger.js` has
  coverage today; `index.js`, `api-client.js`, and `store.js` do not.

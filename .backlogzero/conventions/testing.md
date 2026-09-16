---
name: testing
description: How tests are run and structured — plain node:test, no framework, one file per module
type: convention
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

Tests run on Node's built-in test runner: `npm test` runs `node --test`
(package.json:10). There is no Jest/Mocha/Vitest, no test config file, and no
assertion library beyond `node:assert`.

The only existing test file, `test/logger.test.js`, mirrors the module it tests
one-to-one (`src/logger.js` → `test/logger.test.js`) and imports directly from
`node:assert` (`strict as assert`) and `node:test` (test/logger.test.js:1-3). Follow
that layout for new tests: `test/<module>.test.js` for a module at `src/<module>.js`,
using `assert.doesNotThrow` / `assert.throws` / equality assertions in the same strict
style (test/logger.test.js:8-15) rather than introducing a different assertion
library.

---
name: testing
description: How tests are structured and run in this repo
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

Tests run on Node's built-in test runner, not Jest/Mocha/Vitest:

- `npm test` runs `node --test` (see `package.json`'s `test` script). No test
  framework dependency is installed or needed.
- Test files live under `test/`, named `<module>.test.js`, importing the
  runner primitives directly: `import { test } from 'node:test'` and
  `import { strict as assert } from 'node:assert'`.
- Source is imported by relative path from `test/`, e.g.
  `import { setLevel } from '../src/logger.js'` — there is no path alias or
  test-specific module resolution.
- One `test(...)` call per behavior/case rather than one large test with
  multiple asserts — `test/logger.test.js` has separate `test()` blocks for
  the accept-a-known-level case and the reject-an-unknown-level case.

Only `src/logger.js` has coverage today. There is no coverage tooling
configured (no nyc/c8 in `package.json`).

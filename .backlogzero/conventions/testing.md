---
name: conventions-testing
description: How tests are run and structured — read before adding or changing tests
type: convention
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- Tests run via Node's built-in test runner: `npm test` maps to `node
  --test` (package.json). No Jest/Mocha/Vitest dependency — there is no
  `devDependencies` block at all in package.json.
- Test files live under `test/` (not `src/__tests__` or co-located
  `*.spec.js`) and import from `../src/*.js` directly using `node:assert`'s
  `strict` mode and `node:test`'s `test()`.
- Only `src/logger.js` has coverage today (`test/logger.test.js`, two
  cases: accepts a known level, rejects an unknown one). `src/store.js`,
  `src/api-client.js`, and `src/index.js` have no tests — don't assume
  parity in coverage across modules.

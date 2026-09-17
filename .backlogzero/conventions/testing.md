---
name: testing
description: How tests are run and structured in this repo — Node's built-in test runner, no framework dependency
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

- Test runner is Node's built-in `node --test` (invoked via `npm test`) — there is no Jest,
  Mocha, or Vitest dependency, and `package.json` declares zero `dependencies`/`devDependencies`.
- Tests import from `node:assert` (`strict as assert`) and `node:test` (`test`), e.g.
  `test/logger.test.js:1-3`.
- Test files live under `test/` at the repo root (not co-located with source), named
  `<module>.test.js`, importing the module under test via relative path (`../src/logger.js`).
- Only one test file exists today (`test/logger.test.js`), covering `setLevel`'s accept/reject
  behavior. There is no test coverage for `src/index.js`, `src/api-client.js`, or `src/store.js`.
- When a fixture ticket asks for "one unit test" (see [[fixture-notes]]), match the existing
  style: plain `test('description', () => { ... })` blocks with `assert.doesNotThrow` /
  `assert.throws` / `assert.equal`, no test framework setup/teardown machinery.

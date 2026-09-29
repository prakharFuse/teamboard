---
name: testing
description: How tests are structured and run in this repo
type: convention
scope: global
updated: '2026-09-29'
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

No test framework dependency — `npm test` runs `node --test` (Node's built-in runner). Test files live flat under `test/` as `*.test.js`, importing source via relative ESM paths (e.g. `import { setLevel } from '../src/logger.js'`), matching `package.json`'s `"type": "module"`. Assertions use `node:assert`'s `strict` API (`assert.doesNotThrow`, `assert.throws`), not a third-party assertion library.

Only one test file exists (test/logger.test.js), covering `setLevel`. New tests should follow the same shape rather than introducing a new framework or directory layout — see [[fixture-invariants]] for the one already-planned addition (a `--quiet`-flag test landing in this same file).

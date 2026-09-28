---
name: testing
description: How tests are structured and run — node:test, one file per module under test/
type: convention
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: b42191474b6525053cef5db9ec09a07df66fcef9
sources:
  - package.json
  - package-lock.json
  - test/logger.test.js
  - test/hr-export.test.js
sources_sha256:
  package-lock.json: 2796e0082a18d04adbd9819d53c0d75e7d6375fe6aabb044937585282e7d29e5
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/hr-export.test.js: 5a2b79e3d29557eab789d2036b8ad1f4203784bbf0abe833ca30783e9ca73fd6
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

`npm test` runs `node --test` (`package.json:10`) — Node's built-in test
runner, no Jest/Mocha/Vitest dependency. There is no `node_modules/` and no
`dependencies`/`devDependencies` block in `package.json` at all: the project
has zero npm dependencies today (a `package-lock.json` exists but declares no
packages).

Two test files exist, `test/logger.test.js` and `test/hr-export.test.js`,
both following the same pattern:

- Import the runner primitives directly: `import { strict as assert } from
  'node:assert'; import { test } from 'node:test';`.
- Import only the named exports under test (e.g. `import {
  normalizeDepartment, buildExportRows, CANONICAL_DEPARTMENTS } from
  '../src/hr-export.js'`), not the whole module.
- One `test(...)` block per behavior, named as a plain-English sentence
  describing the expected behavior, covering both valid and invalid/edge-case
  input for the same function.
- File naming: `<module-name>.test.js` in `test/`, mirroring the `src/`
  filename it covers — there is still no test for `store.js` or `index.js`,
  and none for `api-client.js`'s async `request()` method; follow Node's
  `node:test` idioms for those (e.g. `mock.fn`/`mock.method` from
  `node:test`) rather than introducing a new test framework dependency.

`test/hr-export.test.js` also groups related tests under `// Step N:` comment
banners (alias mapping, canonical pass-through, rejection paths, then
`buildExportRows` batch behavior) — a lightweight way of documenting test
grouping without a nested `describe()`.

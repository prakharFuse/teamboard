---
name: testing
description: How tests are structured and run — node:test, one file per module under test/
type: convention
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

`npm test` runs `node --test` (`package.json:10`) — Node's built-in test
runner, no Jest/Mocha/Vitest dependency. There is no `node_modules/` and no
`dependencies`/`devDependencies` block in `package.json` at all: the project
has zero npm dependencies today.

Only one test file exists, `test/logger.test.js`, covering `src/logger.js`'s
`setLevel`. It establishes the pattern to follow for any new test:

- Import the runner primitives directly: `import { strict as assert } from
  'node:assert'; import { test } from 'node:test';`.
- Import only the named exports under test (`import { setLevel } from
  '../src/logger.js'`), not the whole module.
- One `test(...)` block per behavior, named as a plain-English sentence
  describing the expected behavior (`'setLevel accepts a known level'`,
  `'setLevel rejects an unknown level'`), covering both a valid and an
  invalid input case for the same function.
- File naming: `<module-name>.test.js` in `test/`, mirroring the `src/`
  filename it covers (so `src/store.js` would get `test/store.test.js`, etc.)
  — there is no existing test for `store.js`, `api-client.js`, or `index.js`
  yet, so there's no established precedent for testing modules with async
  behavior (`ApiClient.request`) or process-level I/O (`index.js`'s
  `main()`) in this repo; follow Node's `node:test` idioms for those (e.g.
  `mock.fn`/`mock.method` from `node:test`) rather than introducing a new
  test framework dependency.

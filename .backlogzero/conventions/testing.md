---
name: testing
description: How tests are structured and run in this repo — node:test, no framework, one behaviour per test()
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

No test framework is installed — `npm test` runs `node --test`
(`package.json`), Node's built-in test runner. Assertions use
`node:assert`'s `strict` import, not a third-party library (chai, jest, etc.).

## Pattern (from `test/logger.test.js`)

```js
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { setLevel } from '../src/logger.js';

test('setLevel accepts a known level', () => {
  assert.doesNotThrow(() => setLevel('debug'));
  setLevel('info');
});

test('setLevel rejects an unknown level', () => {
  assert.throws(() => setLevel('chatty'), /Unknown log level/);
});
```

- One `test/<module>.test.js` file per source module, importing directly
  from `../src/<module>.js` (relative path, `.js` extension required — this
  is a `"type": "module"` package, no bundler/transpiler in the loop).
  There is currently only `test/logger.test.js`; there are no tests for
  `store.js`, `api-client.js`, or `index.js`.
- Each behaviour (valid input, invalid input) gets its own `test(...)` block
  rather than multiple assertions crammed into one — follow this split for
  new tests (e.g. a `--quiet` flag test belongs in `test/logger.test.js`
  per its `FIXTURE NOTE`, as its own `test()`, not appended into an existing
  one).
- No mocking library — `setLevel` is exercised directly since it's a pure
  side-effecting function on module state; there's no example yet of testing
  code with I/O (e.g. `api-client.js`'s `fetch` calls) in this repo.

---
name: testing
description: How tests are written and run in this repo — node:test, not Jest/Mocha
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

Tests use Node's built-in `node:test` runner and `node:assert` — no Jest,
Mocha, or Vitest is installed (`package.json` has zero `devDependencies`).
`npm test` runs `node --test`, which auto-discovers `test/**/*.test.js`.

Pattern from `test/logger.test.js` (the only existing test):

```js
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { setLevel } from '../src/logger.js';

test('setLevel accepts a known level', () => {
  assert.doesNotThrow(() => setLevel('debug'));
  setLevel('info'); // reset shared module state after the assertion
});

test('setLevel rejects an unknown level', () => {
  assert.throws(() => setLevel('chatty'), /Unknown log level/);
});
```

Notes for new tests in this repo:
- One `test/<module>.test.js` file per `src/<module>.js`, imported with a
  relative `../src/...js` path (ESM, explicit `.js` extension required).
- `src/logger.js` and `src/store.js` hold module-level mutable state
  (`currentLevel`, the `settings` Map) — tests that mutate it must reset it
  before returning, as the existing test does by calling `setLevel('info')`
  at the end.
- Assert on the exact thrown message pattern (e.g. `/Unknown log level/`),
  not just that *something* throws.

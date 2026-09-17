---
name: coding-style
description: Language/runtime/test conventions actually in use — ESM, zero deps, node:test
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/api-client.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- **Pure ESM.** `package.json` sets `"type": "module"`; every file uses
  `import`/`export`, never `require`.
- **Zero dependencies.** `package.json` has no `dependencies` or
  `devDependencies` block. Existing code covers its needs with runtime
  globals/builtins only: global `fetch` and `AbortController`
  (`src/api-client.js`), `node:assert/strict` and `node:test`
  (`test/logger.test.js`). Don't add a package without discussing it first —
  nothing currently in the repo needs one.
- **Named exports only.** `export class ApiClient`, `export function
  getSetting`, `export const logger` — no default exports anywhere in `src/`.
- **Tests use the built-in Node test runner**, not Jest/Mocha/Vitest: `npm
  test` runs `node --test`. Follow `test/logger.test.js`'s shape for new
  tests — one `test('description', () => { ... })` block per behaviour,
  assert with `assert.doesNotThrow` / `assert.throws` / `assert.equal` from
  `node:assert/strict`.

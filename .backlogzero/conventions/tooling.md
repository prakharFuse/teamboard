---
name: tooling
description: Package manager, module system, and test runner conventions — no external deps or frameworks
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

- **ESM only.** `package.json` sets `"type": "module"`; all `import`/`export`
  statements use explicit `.js` extensions on relative paths (e.g. `from
  './logger.js'`), required by Node's ESM resolver.
- **Zero runtime dependencies.** `package.json` has no `dependencies` or
  `devDependencies` block and there is no lockfile in the repo. `ApiClient`
  uses the global `fetch` (Node's built-in, no `node-fetch`). Don't add a
  package for something Node's stdlib already covers — that's consistent
  with how this fixture is written today.
- **Test runner is `node --test`**, not Jest/Mocha/Vitest. Tests import
  `{ strict as assert }` from `node:assert` and `{ test }` from `node:test`.
  `npm test` runs `node --test`, which auto-discovers `test/**/*.test.js`.
  New tests should follow `test/logger.test.js`'s pattern: one `test(...)`
  call per behavior, plain `assert.doesNotThrow` / `assert.throws` /
  `assert.equal`, no test framework config file.
- **CLI is run via `npm start -- <args>`** (or `node src/index.js <args>`
  directly) — `package.json`'s `start` script is `node src/index.js`.

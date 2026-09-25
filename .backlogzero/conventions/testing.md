---
name: testing
description: How tests are structured and run in this repo
type: convention
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - package.json
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

`npm test` runs `node --test` (Node's built-in test runner) — no Jest/Mocha/
Vitest dependency, and `package.json` declares zero `dependencies` or
`devDependencies`. Test files live under `test/` and are named
`*.test.js`, importing `strict as assert` and `test` from `node:test` (see
`../../test/logger.test.js`). There is currently one test file, covering only
`src/logger.js`'s `setLevel`; `src/api-client.js` and `src/store.js` have no
tests yet.

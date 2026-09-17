---
name: code-style
description: ESM/testing conventions inferred from source — no linter or CI config exists to enforce these
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

There is no ESLint/Prettier config, no CI workflow, and no `lint`/`format`
script in package.json — style below is inferred purely from the existing
four source files, not enforced by tooling.

- Plain ESM: `"type": "module"` in package.json; imports always include the
  explicit `.js` extension (e.g. `import { logger } from './logger.js'`).
- No build step or TypeScript — `npm start` runs `node src/index.js`
  directly.
- Tests use Node's built-in `node:test` + `node:assert/strict` (`npm test`
  runs `node --test`), not a third-party framework (Jest/Mocha/Vitest are not
  dependencies — package.json has zero `dependencies`/`devDependencies`).
- Tests live under `test/` and mirror the source file name
  (`test/logger.test.js` tests `src/logger.js`). Only one source module
  (`logger.js`) currently has a test file — `index.js`, `api-client.js`, and
  `store.js` have none.
- Errors from the CLI's `main()` are caught at the top level and reported via
  `logger.error` + `process.exitCode = 1`, not by letting Node print a raw
  stack trace (see `src/index.js`'s `main().catch(...)`).

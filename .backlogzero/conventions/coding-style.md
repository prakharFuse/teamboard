---
name: coding-style
description: Code style and testing conventions inferred from the existing four source files
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

No linter, formatter, or style guide config exists in this repo (no
`.eslintrc*`, `.prettierrc*`, or `tsconfig*` at any level) — these are the
patterns the existing four files actually follow, to match by example:

- **ESM only.** `import`/`export`, `.js` extensions on relative imports
  (`from './logger.js'`), no `require`. `package.json` sets
  `"type": "module"`.
- **Named exports, one class or set of functions per file.** `ApiClient` is
  the only class (`export class ApiClient`); `logger.js`/`store.js` export
  plain functions and one plain object (`logger`).
- **File-level doc comment for intent, not per-function JSDoc.** Every
  `src/*.js` file opens with a `/** ... */` block describing the module's
  purpose; individual functions are not separately documented. Follow this
  density — don't add per-function JSDoc blocks that don't exist today.
- **No custom error classes; throw plain `Error`** with a template-string
  message (`throw new Error(\`Unknown log level: ${level}\`)` in
  `src/logger.js:16`, `throw new Error(\`HTTP ${res.status}\`)` in
  `src/api-client.js:28`).
- **Structured logging via the shared `logger`**, not `console.*` — all
  four source files that log go through `logger.{debug,info,warn,error}`
  from `src/logger.js`, passing a message string plus an optional `meta`
  object as the second argument.
- **Tests use `node:test` + `node:assert/strict`**, one `test()` per
  behavior, file named `<module>.test.js` under `test/` mirroring the
  `src/<module>.js` it covers (`test/logger.test.js` ↔ `src/logger.js`).
  Use `assert.doesNotThrow`/`assert.throws` with a message regex for
  validation-style behavior, matching `test/logger.test.js:8-15`.

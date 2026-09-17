---
name: coding-style
description: Module and style conventions observed across src/*.js — ESM, JSDoc-style header comments, no TypeScript despite README mentioning it
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Plain JavaScript ES modules (`"type": "module"` in package.json), `.js` extensions required
  in relative imports (e.g. `from './logger.js'`), no TypeScript, no bundler, no transpile step.
- Every `src/*.js` file opens with a `/** ... */` block comment describing the module's purpose,
  followed in most files by a second `FIXTURE NOTE:` block — see [[fixture-notes]] for what those
  mean before editing.
- Exports are named (`export function`, `export const`, `export class`), not default exports.
- Errors are thrown as plain `new Error(message)`, not custom error classes.
- Logging always goes through `src/logger.js`'s `logger` object rather than direct
  `console.log`/`console.error` calls.
- No linter or formatter config (no `.eslintrc`, no `.prettierrc`) is present in the repo — there
  is no enforced style beyond what's already consistent in the existing files.

---
name: coding-style
description: JS module/style conventions actually used in src/ — ESM, no build step, no dependencies
type: convention
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - package.json
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Plain ESM JavaScript (`"type": "module"` in `package.json`), `.js`
  extensions on relative imports (e.g. `from './logger.js'`) — no
  TypeScript, no bundler, no transpile step.
- Zero runtime dependencies. `package.json` has no `dependencies` or
  `devDependencies` at all; `src/api-client.js` uses the global `fetch` /
  `AbortController` provided by Node itself rather than a library like axios.
- Modules export plain functions/classes, not default exports (`export
  class ApiClient`, `export function getSetting`, `export const logger`).
- Doc comments are used sparingly, and when a file carries deliberately
  imperfect code for fixture purposes, that's called out with a
  `FIXTURE NOTE:` block comment at the top of the file (or inline next to
  the specific line). See `../knowledge/fixture-gotchas.md` before editing
  any file that has one.
- CLI argument parsing (`src/index.js:parseArgs`) is a hand-rolled loop, not
  a library — follow that pattern for new flags rather than introducing a
  CLI-parsing dependency.

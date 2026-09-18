---
name: code-style
description: Module format, class vs. plain-object style, and comment conventions used in src/
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

- Plain JavaScript, ESM only (`"type": "module"` in `package.json`). No
  TypeScript, no bundler, no transpile step — files run directly under
  `node src/index.js`.
- Stateful singletons are exported as plain functions/objects
  (`logger`, `setLevel`, `getSetting`), not classes — `src/logger.js` and
  `src/store.js` both follow this. `ApiClient` in `src/api-client.js` is the
  one exception, exported as a `class` because it holds per-instance config
  (`baseUrl`, `region`) rather than shared module state.
- Every `src/*.js` file opens with a `/** ... */` block comment describing
  the module's purpose. Several of these are tagged `FIXTURE NOTE:` — see
  `[[fixture-gotchas]]` before changing anything under one of those.
- Logging goes through `logger` from `src/logger.js`, never raw
  `console.log`/`console.error` — `emit()` routes `warn`/`error` to
  `process.stderr` and everything else to `process.stdout`, and gates on
  `currentLevel` so `--verbose`/level changes actually suppress output.
- CLI argument parsing is hand-rolled in `parseArgs` (`src/index.js`) rather
  than a library (`yargs`, `commander`, etc. are not dependencies) — new
  flags are added as extra branches in that same function.

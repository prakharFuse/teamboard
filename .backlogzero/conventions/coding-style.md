---
name: coding-style
description: Language, module, and comment conventions actually used in teamboard's source
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Plain JavaScript throughout — no TypeScript, no build/transpile step, despite
  README.md's Configuration section referencing a `src/config.ts` that does not exist
  (see [[overview]] for that divergence). Don't introduce `.ts` files unless a ticket
  explicitly asks for a TypeScript migration.
- ESM only (`"type": "module"` in package.json): `import`/`export`, `.js` extensions
  required in relative import specifiers (e.g. `from './logger.js'`, not `'./logger'`).
- One class in the whole codebase (`ApiClient` in `src/api-client.js`); everything else
  is plain exported functions and objects (`logger`, `getSetting`, `setSetting`,
  `allSettings`, `setLevel`, `parseArgs`). Default to a function/module-object export
  unless a ticket specifically needs instantiable state like `ApiClient` has
  (`baseUrl`/`region` per instance).
- Every `src/*.js` file opens with a block comment: a one-line description of the
  module, then (where relevant) a `FIXTURE NOTE:` paragraph explaining why an
  intentional-looking smell is there — see [[fixture-notes]]. Follow this pattern for
  new fixture files: real files in this repo don't get ordinary prose docstrings
  otherwise.
- Errors are thrown with plain `Error` and a short message (e.g.
  `` `Unknown log level: ${level}` `` in `src/logger.js`) — no custom error classes.

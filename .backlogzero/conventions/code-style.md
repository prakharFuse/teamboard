---
name: code-style
description: Module system, class/function style, and comment conventions used in src/
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
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

- Plain JavaScript (no TypeScript, no build step). `package.json` sets
  `"type": "module"` — use ESM `import`/`export`, always with explicit `.js`
  extensions in relative imports (e.g. `from './logger.js'`), not bare
  extensionless specifiers.
- No linter or formatter is configured (no `.eslintrc*`, no `prettier*`
  config, no lint/format npm script) — there is no automated style gate to
  satisfy beyond what's already in the files.
- Stateful singletons are plain module-level bindings (`let currentLevel` in
  `src/logger.js`, `const settings = new Map()` in `src/store.js`), not
  classes — reserve `class` for things with real instance state
  (`ApiClient` in `src/api-client.js` holds `baseUrl`/`region` per instance).
- Top-of-file JSDoc-style block comments describe the module's purpose; a
  `FIXTURE NOTE:` paragraph inside that block (when present) documents which
  test-tier fixture the file's current shape exists for — see
  [[fixture-gotchas]] before restructuring a file that has one.

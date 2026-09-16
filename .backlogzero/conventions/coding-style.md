---
name: coding-style
description: Conventions inferred from the four existing source files (no linter/formatter is configured)
type: convention
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

No `.eslintrc*`, `.prettierrc*`, `tsconfig*`, or `.editorconfig` exists in
this repo, and `package.json` declares no lint/format scripts or
dev-dependencies at all. Conventions here are inferred purely from the
existing four files — follow them for consistency, but there is no tool
enforcing them.

- **Plain ESM, no TypeScript.** `package.json` sets `"type": "module"`;
  every file uses `import`/`export`, 2-space indentation, and single quotes.
- **No framework, no external runtime dependencies.** `package.json` lists
  none — `ApiClient` uses the global `fetch`, not axios/node-fetch.
- **File-per-concern under `src/`, flat (no subdirectories).** Each module
  exports either plain functions (`logger.js`, `store.js`) or a single class
  (`api-client.js`).
- **Every module opens with a `/** ... *​/` block comment**, and non-obvious
  lines (magic numbers, deliberately-global state) carry an inline `//`
  comment explaining why — see [[fixture-gotchas]] for which of those are
  fixture setup rather than genuine TODOs.
- **Tests use the built-in `node:test` + `node:assert`**, not Jest/Mocha/Vitest.
  Run with `npm test` (→ `node --test`). Test files live in `test/`, named
  `<module>.test.js`, importing from `../src/<module>.js`. Only
  `test/logger.test.js` exists today — it is the pattern to copy for new
  test files, one `test('description', () => { ... })` block per behavior.

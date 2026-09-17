---
name: code-style
description: Comment and naming conventions observed across the four src/ files
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- **File-header block comments** (`/** ... */`) describe the module's role in
  one or two lines, followed by a `FIXTURE NOTE:` paragraph where relevant
  (see [[gotchas]]). New files added to `src/` should follow this shape: a
  short purpose comment, no fixture note unless you're deliberately planting
  or documenting a fixture behavior.
- **No TypeScript.** Despite the README mentioning `src/config.ts`, every
  actual source file is plain `.js`. Don't introduce `.ts` files without
  also adding a build/type-check step — none exists today (no `tsconfig.json`,
  no `typescript` dependency).
- **Functions over classes**, except `ApiClient` — the one exported class in
  the codebase, used for the one component that holds instance state
  (`baseUrl`, `region`). `logger.js` and `store.js` export plain functions and
  a plain object (`logger`) instead of classes; follow that split (state +
  networking → class, stateless helpers → functions) if extending.
- **Error handling**: `logger.error('fatal', { message: ... })` at the
  top-level `main().catch(...)` in `src/index.js` is the only global catch;
  functions below it (`ApiClient.request`, `setLevel`) throw plain `Error`
  objects with a descriptive message and let the caller decide. Don't add
  try/catch inside `store.js` or `logger.js` — the existing code has none by
  design.

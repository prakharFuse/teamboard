---
name: coding-conventions
description: Language, module, and comment conventions inferred from src/*.js
type: convention
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Plain ESM JavaScript, not TypeScript, despite README.md pointing at a
  `src/config.ts` that doesn't exist — see the divergence note in
  [[overview]]. Don't introduce `.ts` files without also adding a
  `tsconfig.json` and a build step; neither exists today.
- Every file under `src/` opens with a `/** ... */` block comment. In this
  repo that block is doing double duty: normal file-purpose docs, plus a
  `FIXTURE NOTE:` paragraph explaining which journey-suite ticket the
  file's rough edge (hardcoded literal, missing flag, global store) is
  there to support. Preserve the `FIXTURE NOTE` paragraphs — they're load
  -bearing for the fixture's purpose per README.md, not stale TODOs.
- Hardcoded literals in `src/api-client.js` (base URL, region, retry count,
  timeout, page size) and `src/store.js` (`DEFAULTS`) are intentional, not
  an oversight — see the FIXTURE NOTE comments in those files before
  "cleaning up" or centralizing them.
- No lint or format config (no `.eslintrc*`, no `.prettierrc*`) is present in
  the repo — don't assume a linter will catch style issues.

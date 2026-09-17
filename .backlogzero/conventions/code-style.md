---
name: code-style
description: Module/import conventions and comment style to follow when editing teamboard source
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

## Modules

- Plain `.js`, ESM only (`"type": "module"` in `package.json`). No TypeScript, no build step, no bundler.
- Imports use explicit `.js` extensions for local files: `import { logger } from './logger.js';` — required by Node's native ESM resolution, don't drop the extension when adding new local imports.
- No third-party runtime dependencies exist yet (`package.json` has no `dependencies` block). Adding a library is a real, visible change to `package.json` — don't add one for something the standard library already covers (e.g. `fetch`, `node:test`, `node:assert` are already in use).

## Comments

Every existing source file carries a `FIXTURE NOTE` block comment at the top or inline near the specific rough edge it explains (see `../knowledge/overview.md` for the list). These explain *why* something looks wrong on purpose. When editing a file that has one:
- Read it before changing the surrounding code — it tells you whether the "flaw" is the point of a ticket you might be working on, or an unrelated fixture concern.
- Don't delete a `FIXTURE NOTE` as part of an unrelated change; only remove/update one when a task explicitly resolves the exact thing it describes.

Otherwise the codebase favors minimal comments — short one-line clarifications only where the code itself doesn't say why (matches the sparse style already in `src/logger.js` and `src/store.js`).

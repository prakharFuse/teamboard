---
name: overview
description: What this repo is and how to run it — read first for any task here
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - README.md
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is fixture content, not a product — see README.md for the full
rationale (it's a small task-tracking CLI used as the seed repository for a
journey-suite test harness that clones/branches/PRs against it).

## Running it

- Entrypoint: `src/index.js` (has a `#!/usr/bin/env node` shebang), wired via
  `package.json`'s `main` and `start` script.
- `npm start -- <command> [--verbose]` or `node src/index.js <command>`.
- Commands: `status` (prints settings from `src/store.js`), `tasks` (fetches
  page 1 via `src/api-client.js`'s `ApiClient`), `help`/`-h`.
- `--verbose` raises the logger to `debug` level (`src/logger.js`).
- Tests: `npm test` → `node --test` (see `test/logger.test.js`).
- No dependencies: `package.json` declares neither `dependencies` nor
  `devDependencies`.

## Divergence from README.md

README.md's Configuration section says: "Environment variables are read in
`src/config.ts`. See that file for the current list." No `src/config.ts` (or
any config file) exists in the working tree, and no file under `src/` reads
`process.env`. In reality every configurable value (API base URL, region,
timeout, retry count, backoff base, page size, default log level, settings
defaults) is a hardcoded literal inside `src/api-client.js`, `src/logger.js`,
and `src/store.js` — see [[fixture-notes]] for why that's intentional and
should not be "fixed" without a specific task asking for it.

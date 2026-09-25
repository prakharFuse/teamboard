---
name: overview
description: What teamboard is, why it's small, and how to run it
type: knowledge
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - package.json
  - README.md
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Fixture repository, not a real product — see `../../README.md` for the full
explanation (it exists so agent journeys have a real repo to clone/branch/PR
against). Several source files carry `FIXTURE NOTE` block comments; those
describe an intentional design gap (hardcoded config, a global settings
store, a missing `--quiet` flag) that a *different* fixture ticket asks an
agent to fix. Do not "clean up" what a FIXTURE NOTE describes — it is the
subject of some other ticket, not an oversight.

Run with `npm start -- --help` / `npm start -- status` / `npm start -- tasks`
(see `../../package.json` for the scripts). Tests: `npm test` (Node's built-in
`node --test` runner, no external test framework).

Diverges from README.md: the README's Configuration section says "Environment
variables are read in `src/config.ts`" — no `src/config.ts` file exists in
this repo, and no source file reads `process.env` anywhere. All configuration
is either a hardcoded literal in `src/api-client.js`/`src/logger.js` or an
in-memory default in `src/store.js`. Treat the README's config pointer as
stale until a config module actually lands.

---
name: overview
description: What this repository is and why it looks deliberately minimal — read this first
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - package.json
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is not a product — it is the fixture repository for an external
journey-testing suite. See ../../README.md for the full statement of intent
(re-seeding command, provenance from `tests/journeys/seed/journey-repo/`).

The repo is a single small Node.js CLI (`teamboard`), plain ESM JavaScript,
no build step, no TypeScript, no database, no client/server split. Entry
point is `src/index.js` (`npm start`), tests run via Node's built-in test
runner (`npm test` → `node --test`).

## The load-bearing detail: FIXTURE NOTE comments

Every source file carries a `FIXTURE NOTE` doc comment explaining that some
piece of otherwise-questionable code (magic numbers, a misspelled heading, a
global settings store, a bare arg parser) is intentionally left rough so an
external test suite has something concrete to ask an agent to fix. See
[fixture-notes](fixture-notes.md) for the inventory and what NOT to touch.

If you are asked to do general cleanup, refactoring, or "audit this code" in
this repo without a specific ticket driving it, treat the `FIXTURE NOTE`
comments as intent, not tech debt — read [fixture-notes](fixture-notes.md)
before changing anything they cover.

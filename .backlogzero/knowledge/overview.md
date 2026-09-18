---
name: overview
description: What teamboard is, why it exists, and the module map — read this first
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - package.json
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is not a product — it is a **fixture repository** for a journey-test
suite (see `README.md`). It gets cloned, branched, and PR'd against by agents
resolving synthetic Jira tickets, then reconciled back against
`tests/journeys/seed/journey-repo/` in the suite's own repo (not this one).
That framing matters more here than in a normal project: several things in
this codebase that *look* like bugs or debt are the deliberate subject of a
fixture ticket, and "fixing" them on your own initiative removes the ticket's
reason to exist. See `[[fixture-gotchas]]` before touching any file.

## What's actually here

A single Node.js ESM CLI, no build step, no framework:

- `src/index.js` — entrypoint, hand-rolled `parseArgs`, three commands:
  `status`, `tasks`, `help` (default command is `status`).
- `src/logger.js` — level-gated console logger (`debug`/`info`/`warn`/`error`),
  module-level mutable `currentLevel`.
- `src/store.js` — in-memory global settings store (a `Map` + hardcoded
  `DEFAULTS`), not per-tenant.
- `src/api-client.js` — `ApiClient` class wrapping `fetch` against a
  hardcoded upstream URL, with manual retry/backoff.
- `test/logger.test.js` — the only test file, uses node's built-in
  `node:test` + `node:assert` (no Jest/Mocha/Vitest).

Run via `npm start -- <command> [--verbose]` or `npm test`. There is no
`server/` or `client/` split, no database, no HTTP server — `ApiClient` is an
*outbound* client to an external (imaginary, in this fixture) task API, not
something this repo serves.

## Divergences

Diverges from `README.md`: the README says "Environment variables are read in
`src/config.ts`. See that file for the current list." — `src/config.ts` does
not exist anywhere in the repository, the project is plain `.js` (no
TypeScript at all), and nothing in the codebase calls `process.env`. Settings
are actually hardcoded as `DEFAULTS` inside `src/store.js`; there is no config
module and no env-var reading today.

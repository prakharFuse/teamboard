---
name: overview
description: What this repo is, why it exists, and its real (current) file layout
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - package.json
  - README.md
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Purpose and re-seeding process are covered in `../../README.md` — read that
first. This page adds only what the README doesn't state.

## Current shape (code-verified)

The repo is JS-only, no TypeScript, no build step, no third-party
dependencies (`package.json` has no `dependencies`/`devDependencies` block at
all). Four files make up the whole app:

- `src/index.js` — CLI entrypoint (`teamboard <command>`), commands: `status`,
  `tasks`, `help`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`).
- `src/store.js` — in-memory, process-global settings store with hardcoded
  defaults.
- `src/api-client.js` — `fetch`-based HTTP client for a (fake/example)
  upstream task API, with hand-rolled retry/backoff.

`test/logger.test.js` is the only test file, run via Node's built-in
`node --test` (see `../conventions/testing.md`).

There is no `client/` or `server/` split and no database in this repo as of
`605e18e` ("fixture: remove server/tsconfig.json (no longer in the pack)") —
an earlier variant of the fixture pack apparently had a `server/tsconfig.json`
that no longer applies. Don't assume a client/server architecture from older
context; the working tree above is authoritative.

## Divergence from README

`../../README.md`'s "Configuration" section says "Environment variables are
read in `src/config.ts`. See that file for the current list." That file does
not exist in the current working tree, and no source file reads
`process.env` anywhere in the repo. Treat the README's Configuration pointer
as stale; there is currently no environment-variable configuration surface.

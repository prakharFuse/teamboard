---
name: overview
description: What teamboard is and why the repo looks intentionally small/odd
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
---

teamboard is not a product — it is a fixture repository for an external
"journey suite" test harness (see README.md). Journeys resolve a simulated
Jira ticket against this repo: clone it, plan, branch, and open a PR. The
code exists only so those tickets have something real to point at.

## What's actually here

A tiny Node.js CLI (`type: module`, ESM, no build step, no bundler):

- `src/index.js` — entrypoint, minimal `argv` parser, `status`/`tasks`/`help` commands
- `src/logger.js` — leveled console logger (`debug`/`info`/`warn`/`error`)
- `src/api-client.js` — `ApiClient` class, fetch-based HTTP client with retry/backoff
- `src/store.js` — in-memory global settings store (`Map` + hardcoded defaults)
- `test/logger.test.js` — one `node:test` file

Run with `npm start -- <command>` (see `src/index.js:23` for the command list) or
`npm test` to run the native test runner.

## Why the code looks unfinished or oddly structured

Every non-trivial file carries a `FIXTURE NOTE` comment explaining which test
tier it exists to support (easy/medium/complex). Those notes are load-bearing:
they mark code that must stay exactly as-is so a specific fixture ticket
remains answerable. See [[fixture-gotchas]] before changing `src/store.js`,
`src/api-client.js`, `src/logger.js`, `src/index.js`, or the README heading.

## Divergence from README

README.md states "Environment variables are read in `src/config.ts`. See that
file for the current list." No `src/config.ts` exists anywhere in the repo,
and no code reads `process.env` at all — settings are hardcoded defaults in
`src/store.js` (`DEFAULTS`, `getSetting`/`setSetting`/`allSettings`), held in
an in-memory `Map` with no env-var integration. Treat `src/store.js` as the
actual source of truth for settings, not the README's `config.ts` reference.

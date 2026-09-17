---
name: overview
description: What teamboard is, why it exists, and how to read the rest of this overlay
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

Teamboard is not a product — it is a fixture repository for BacklogZero's own journey
test suite (see README.md). It exists so journeys that resolve a real ticket have a
real, small repo to clone, plan against, branch, and open a PR on. See README.md for
the fixture's purpose and re-seeding mechanics; this overlay only adds what the README
doesn't cover.

## Shape of the code

Plain ESM JavaScript (`"type": "module"` in package.json), zero runtime dependencies,
zero devDependencies. Four files in `src/`, one test file in `test/`. Run with
`npm start -- <command>`, test with `npm test` (`node --test`).

- `src/index.js` — CLI entrypoint: arg parsing, command dispatch (`status`, `tasks`, `help`).
- `src/logger.js` — levelled console logger (debug/info/warn/error), used everywhere.
- `src/api-client.js` — `ApiClient` class, fetches from a hardcoded upstream task API with retry/backoff.
- `src/store.js` — in-memory global settings store (`Map` + defaults).
- `test/logger.test.js` — the only test file; covers `setLevel`.

## Before treating anything here as a bug

Several things that look like code smells are deliberate fixture subjects for other
tickets, and are called out with `FIXTURE NOTE` comments directly in the source. Read
[[fixture-notes]] before "fixing" the misspelled README title, the hardcoded values in
`src/api-client.js`, or the global store in `src/store.js` — each is the intentional
subject of a specific fixture ticket, not an oversight.

Diverges from README.md: the README's Configuration section says "Environment
variables are read in `src/config.ts`. See that file for the current list." No
`config.ts` (or any config module) exists anywhere in the repo — there is no
TypeScript in this project at all, and no environment-variable reads in `src/`.
Treat that README line as aspirational/stale, not as a pointer to real code.

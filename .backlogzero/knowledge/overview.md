---
name: overview
description: What teamboard is, why it exists, and how the pieces fit together — read first
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

Teamboard is not a product — it is the journey suite's **fixture repository**
(see README.md). It exists so automated planning/agent journeys have a real,
small repo to clone, branch, and open PRs against. Several files carry
`FIXTURE NOTE:` comments explaining which future ticket each piece of code is
the "answer key" for. Read those comments before "cleaning up" anything —
what looks like debt (magic numbers, a global store, a misspelled README
heading) is deliberate bait for a specific fixture tier. See README.md for
the full list of intentional issues and the `tiers.easy/medium/complex`
naming scheme.

## Runtime shape

A single Node.js CLI, no server, no database, no framework:

- `src/index.js` — entrypoint, tiny arg parser (`parseArgs`), three commands:
  `help`, `status`, `tasks`.
- `src/logger.js` — level-gated console logger (`debug`/`info`/`warn`/`error`),
  writes `warn`/`error` to stderr, everything else to stdout.
- `src/store.js` — in-memory, process-global settings store (`Map` +
  `DEFAULTS`), no persistence, no tenancy.
- `src/api-client.js` — `ApiClient` class wrapping `fetch` with retry/backoff
  against a hardcoded upstream URL; used only by the `tasks` command.

Run with `npm start -- <command>` (`node src/index.js`). No build step — plain
ESM (`"type": "module"` in package.json), executed directly by Node.

## Divergence from README

Diverges from README.md: the "Configuration" section states "Environment
variables are read in `src/config.ts`. See that file for the current list."
No `src/config.ts` (or any config file) exists in this repo, and there is no
`process.env` usage anywhere in `src/`. Settings currently come only from
`src/store.js`'s hardcoded `DEFAULTS`. Treat the README's config-file claim as
aspirational/stale, not current behavior.

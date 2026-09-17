---
name: overview
description: What this repository is, why it exists, and why its code looks unusually rough on purpose — read this first
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

Teamboard is a **fixture repository**, not a product. It exists to give an
agent-evaluation "journey suite" a small, real codebase to clone, plan
against, branch, and open pull requests on. See `README.md` for the seeding
mechanism (`pnpm test:journey provision-repo`, reconciled against
`tests/journeys/seed/journey-repo/` in the suite's own repo — that
reconciliation source is outside this repo and not inspectable from here).

## What actually exists

A single-process Node.js CLI, ESM (`"type": "module"` in `package.json`),
with four files under `src/`:

- `src/index.js` — CLI entrypoint; minimal arg parser, `status`/`tasks`/`help` commands.
- `src/logger.js` — levelled console logger (debug/info/warn/error).
- `src/store.js` — in-memory global settings map with defaults.
- `src/api-client.js` — `fetch`-based HTTP client with manual retry/backoff.

No database, no server, no framework. `test/logger.test.js` is the only test
file, using Node's built-in `node:test` + `node:assert`.

## Why the code looks unfinished

Every "rough edge" in this repo is deliberate bait for a specific fixture
ticket, marked inline with a `FIXTURE NOTE` comment. See
[[gotchas]] before changing anything — fixing these "issues" outright removes
the subject of the ticket that's supposed to exercise them.

## Divergence from README

`README.md` states: "Environment variables are read in `src/config.ts`. See
that file for the current list." **No `src/config.ts` file exists anywhere in
this repo**, and there are no `.ts` files at all — the codebase is plain
JavaScript. Configuration (log level default, API base URL, region, timeouts,
retry counts, pagination size) is instead hardcoded and intentionally
scattered across `src/logger.js` and `src/api-client.js`. This isn't a stale
doc to fix — see [[gotchas]]: centralizing that scattered config is itself a
fixture ticket's subject.

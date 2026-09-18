---
name: overview
description: What teamboard is, why it exists, and how to run it — read first for any task on this repo
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

Teamboard is a **fixture repository**, not a product. See ../../README.md for the
full framing: it exists so an external "journey suite" has a real repo to clone,
branch, and open pull requests against while resolving simulated Jira tickets.
The misspelled README title ("Teambaord") is intentional — do not fix it unless
that is literally the task you were given.

## Running it

Zero npm dependencies (check `package.json` — no `dependencies` or
`devDependencies` keys at all). Everything relies on Node built-ins (`fetch`,
`node:test`, `node:assert`).

```bash
npm start -- --help     # -> node src/index.js --help
npm test                # -> node --test (runs test/*.test.js)
```

CLI commands (`src/index.js`): `status` (print current settings via
`src/store.js`), `tasks` (fetch page 1 via `src/api-client.js`), `help`.
`--verbose` flips the logger to `debug` level; there is no `--quiet` flag yet
(see [[fixture-gotchas]] — that gap is intentional).

## Module map

Four files under `src/`, each self-contained:
- `index.js` — CLI entrypoint and arg parsing
- `logger.js` — levelled console logger (debug/info/warn/error)
- `api-client.js` — HTTP client for an upstream task API, with retry/backoff
- `store.js` — in-memory global settings map with hardcoded defaults

See [[architecture]] for how they connect, and [[fixture-gotchas]] before
changing any of them — most of the "rough edges" in this code are deliberate
fixture subjects, not bugs.

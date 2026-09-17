---
name: overview
description: What teamboard actually is (a journey-suite fixture, not a product) and how the code is laid out
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - README.md
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Teamboard is a fixture repository (see `README.md`), not a real product. It backs
an automated "journey suite" that hands an agent a Jira-style ticket and checks
whether the agent can plan/implement a fix against a real, small repo. The
literal contents of `src/` are deliberately unpolished — see
[[fixture-design]] before treating anything here as a bug to clean up.

## Actual layout (verify before trusting any pre-built index)

```
package.json        # no dependencies, no lockfile, no lint/tsconfig
README.md
src/
  index.js          # CLI entrypoint: parseArgs, printHelp, main
  api-client.js      # ApiClient class — fetch wrapper with retry
  logger.js          # level-gated console logger
  store.js           # in-memory global settings store
test/
  logger.test.js     # node:test coverage for setLevel
```

That's the whole repo. There is **no client/**, **no server/**, **no database**,
and **no `src/config.ts`** — any documentation, generated index, or memory that
describes a client/server split, an Express router, or a SQLite `getDb()` is
describing a different snapshot of this repo, not the current working tree.
Re-derive structure from `find`/`Read`, not from a cached map.

## Runtime facts

- Pure ESM (`"type": "module"` in `package.json`), Node built-ins only —
  no `dependencies`/`devDependencies` in `package.json`, no lockfile.
- `npm start -- <command>` runs `src/index.js`. Commands: `status`, `tasks`,
  `help` (default is `status`). Only `--verbose` and `-h`/`--help` flags exist
  today (`src/index.js:13-21`).
- `npm test` runs `node --test`, which picks up `test/logger.test.js`.
- `ApiClient` (`src/api-client.js`) talks to a hardcoded upstream URL
  (`https://api.teamboard.example.com/v1`) using the global `fetch` — there is
  no HTTP server in this repo to receive those calls; it's a client only.

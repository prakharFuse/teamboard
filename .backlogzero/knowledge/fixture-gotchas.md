---
name: fixture-gotchas
description: Intentional rough edges in this fixture repo that must NOT be silently cleaned up — read before refactoring or auditing any src/ file
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

This repo is deliberately imperfect. Each "rough edge" below is the subject of
a specific fixture ticket elsewhere in the journey suite. Only touch one of
these if the task you were actually given asks for that exact change —
otherwise leave it as-is, even if it looks like an obvious cleanup.

- **`README.md` title "Teambaord"** — misspelled on purpose; the easy-tier
  fixture ticket is to fix exactly this typo. Fixing it unprompted removes
  that ticket's subject.
- **`src/api-client.js` hardcoded values** — `baseUrl`, `region`, retry count
  (`3`), request timeout (`15000`), backoff base (`250 * 2 ** attempt`), and
  page size (`50`) are scattered on purpose. A "centralize config" audit
  ticket expects an agent to find and consolidate these; don't do it as a
  side effect of an unrelated change.
- **`src/logger.js` hardcoded default level** (`'info'`) — same
  config-centralization ticket expects this value to be found too.
- **No `--quiet` flag in `src/index.js`** — only `--verbose` exists. A
  medium-tier ticket adds `--quiet` (suppress info-level output) plus "one
  unit test", which lands in `test/logger.test.js`. Don't add it unless asked.
- **`src/store.js` is a global, tenant-less settings store** — a complex-tier
  ticket asks to migrate it to a per-tenant schema. Keep it global otherwise.

## Divergence from README.md

README.md says: "Environment variables are read in `src/config.ts`. See that
file for the current list." That file does not exist in this working tree,
and no file under `src/` reads `process.env` anywhere. Treat this as a stale
claim, not current behavior — don't point future work at `src/config.ts`.

## Stale pre-indexed maps

If a repository map you were handed describes `client/src/App.tsx`,
`server/src/db.ts`, Express routes, or SQLite — that map is from a different
project or an outdated pack. This repo is a flat `src/`/`test/` Node CLI with
zero dependencies (see [[overview]]). Trust the working tree, not a stale map.

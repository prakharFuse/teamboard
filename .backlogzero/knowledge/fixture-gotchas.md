---
name: fixture-gotchas
description: Intentional rough edges in the code, each tied to a specific fixture ticket — read before "cleaning up" anything
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

This repo is consumed by an external journey/fixture test suite (see
[[overview]]). Several pieces of code are intentionally imperfect so that a
specific ticket has something real to do. Every one of these is marked with a
`FIXTURE NOTE` comment at its source — grep for `FIXTURE NOTE` to find them
all. Only touch one of these if the task you were actually given is the
matching ticket below; otherwise leave it as-is, even if it looks like an
obvious drive-by fix.

| Rough edge | File | What the matching ticket asks for |
|---|---|---|
| "Teambaord" misspelled in the README H1 | `README.md:1` | Correct the spelling — this is the entire `tiers.easy` ticket. Fixing it opportunistically as part of unrelated work removes that ticket's subject. |
| No `--quiet` flag / `setLevel` exists but isn't wired to a CLI flag | `src/index.js` (`parseArgs`), `src/logger.js` | Add a `--quiet` flag to `parseArgs` that suppresses info-level output, plus one unit test in `test/logger.test.js` (`tiers.medium`). |
| Hardcoded, scattered magic numbers and env-dependent strings: retry count (`3`), timeout (`15000`), backoff base (`250`), page size (`50`), base URL, region | `src/api-client.js` | Audit and centralize into a config module / env overrides (`tiers.complex`). Don't preemptively centralize these for unrelated tasks. |
| Global, non-tenant-scoped settings store (`Map` + flat `DEFAULTS`) | `src/store.js` | Migrate to a per-tenant schema (`tiers.complex`). Don't add a tenant dimension unless this is the ticket. |

## Also intentional, not a gotcha to "fix"

- `src/store.js` and `src/logger.js` both use module-level mutable state
  (`settings` Map, `currentLevel` variable) rather than dependency injection.
  This is consistent with the fixture's small scope — don't refactor to
  classes/DI unless a task specifically asks for it.

---
name: fixture-gotchas
description: Intentional "flaws" in this repo that must be left alone — each backs a specific test-tier fixture
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

This repo is re-seeded from a source pack (README.md: "Content is reconciled
against `tests/journeys/seed/journey-repo/`, so edit the pack, never the
remote"). Several things that look like bugs or debt are the deliberate
*subject* of a fixture ticket. Fixing them by hand collapses that ticket's
plan to nothing. Do not "clean these up" unless a task explicitly asks for
that exact change.

## Do not touch

| File / thing | Looks like | Is actually for |
|---|---|---|
| `README.md:1` heading "Teambaord" | A typo | `tiers.easy` fixture: agent is asked to fix this exact spelling. Fixing it yourself makes that ticket a no-op. |
| `src/api-client.js` (`baseUrl`, `region`, retry count `3`, timeout `15000`, backoff `250 * 2 ** attempt`, page size `50`) | Scattered magic numbers/config that should be centralized | `tiers.complex` fixture: "audit the repo and centralize hardcoded config." Consolidating these yourself removes the audit target. |
| `src/store.js` (module-level `Map`, no tenant dimension) | A global-mutable-state anti-pattern | `tiers.complex` fixture: "migrate the legacy global settings store to per-tenant schema." Keep it global. |
| `src/logger.js` (`currentLevel` module state) + `src/index.js` arg parser (no `--quiet`) | Missing feature | `tiers.medium` fixture: "add a `--quiet` flag that suppresses info-level output," expected to land as one unit test in `test/logger.test.js`. Both the level concept and the arg parser must stay in place, unmodified, until that ticket adds the flag. |

## If you're asked to actually implement one of these

That's the normal case, not an exception — a real ticket resolving `tiers.medium`
or `tiers.complex` should implement the change fully (e.g. actually add
`--quiet`, actually centralize config). The rule above only means: don't
preemptively "fix" these as unrequested cleanup while working on something
else in the file.

---
name: fixture-design
description: Read before "fixing" anything here — which rough edges are intentional fixture subjects, per code comments
type: knowledge
scope: global
updated: '2026-09-17'
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

`README.md` states this repo is fixture content for a journey test suite, and
is reconciled from an external seed pack (`tests/journeys/seed/journey-repo/`,
not present in this checkout) — edits made directly here can be overwritten on
the next reseed. Beyond the README's general warning, each source file carries
a `FIXTURE NOTE` doc comment naming the specific ticket it exists to support.
Consolidated here since they're scattered one-per-file:

| File | Planted "issue" | What the intended ticket asks for |
|---|---|---|
| `README.md:1,5-8` | "Teambaord" heading typo | `tiers.easy` — fix the typo. Only that. |
| `src/logger.js` | Level concept exists but no CLI flag suppresses info output | `tiers.medium` — add a `--quiet` flag (in `src/index.js`'s `parseArgs`) that maps to this, plus **one** unit test in `test/logger.test.js` |
| `src/api-client.js` | Hardcoded/scattered magic numbers: retry count (`3`), timeout (`15000`), backoff base (`250`), page size (`50`), base URL, region string | `tiers.complex` — audit and centralize into config/env — an *auditing* ticket, not a silent cleanup |
| `src/store.js` | Global, tenant-less settings `Map` | `tiers.complex` — migrate to a per-tenant schema |

**Practical implication:** if you're asked to do general cleanup, refactor, or
"tidy up hardcoded values" in this repo without a specific ticket driving it,
check this table first — collapsing the `api-client.js` magic numbers into one
config object, or fixing the README typo, isn't a neutral improvement here; it
removes the reason a real journey ticket has anything to plan against. Only
make these changes when a ticket explicitly asks for that exact thing.

Anything **not** listed in this table (e.g. actual bugs in `parseArgs`,
missing error handling, genuinely broken behavior) is fair game — the fixture
notes only protect the specific rough edges they name.

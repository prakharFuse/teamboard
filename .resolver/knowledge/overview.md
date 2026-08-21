---
name: overview
description: Where to find stack, layout, and command info; points to CLAUDE.md/README plus one gap they omit
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - package.json
sources_sha256:
  CLAUDE.md: 4a4c5b4ece44e69fe1e5d6f0849feef9461f2acc275a1c6c8341b62405e118ec
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

For stack, directory layout, and available `pnpm` scripts, see ../../CLAUDE.md and ../../README.md — both are accurate and current with `package.json`.

## Gap: current CI status

Neither doc mentions that `pnpm test` (and therefore CI, see ../../.github/workflows/ci.yml) is **currently failing on `main` by design**. `server/src/routes/members.test.ts` has a red test asserting `POST /api/members` rejects an invalid `department` with 400 — the route performs no such validation today. This is tracked as TM-105 and is intentional (see comments in the test file and CI workflow), not a regression to chase. See [[gotchas]] for the implementation detail that makes this non-trivial to fix.

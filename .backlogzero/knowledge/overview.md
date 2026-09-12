---
name: overview
description: What TeamBoard is, its stack, and where the pieces live — read first for orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team-directory app: manage member profiles, departments, and an HR CSV export. Stack, getting-started commands, the API table, and the on-disk project layout are all documented accurately in [README.md](../../README.md) — see that file rather than duplicating it here.

One correction to the README's scripts table: `pnpm test` first runs `pnpm build` (compiles server TS to `dist/`) and then runs `node --test` against the compiled `dist/server/**/*.test.js` — there is no separate test compile step, so a stale `dist/` from a failed build can make `pnpm test` run old code. Always let `pnpm build` finish (or fix the build error) before trusting a `pnpm test` result.

For the CI-relevant, currently-failing test and the department-validation gap behind it, see [[gotchas]].

---
name: overview
description: What TeamBoard is, its stack, and where to find setup/scripts (read first)
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team directory: list/add/remove members and view
department stats, with a CSV export for HR. Stack, prerequisites, getting
started, the API table, and the on-disk project structure are accurate as
documented in `../../README.md` — read that first.

## Gap: scripts not listed in the README

`package.json` also defines `pnpm lint` (ESLint flat config) and `pnpm test`
(builds then runs `node --test` against compiled server output). The
README's script table only lists `dev`, `build`, `typecheck`, and `start`.
CI (`.github/workflows/ci.yml`) runs typecheck, lint, and test on every PR —
all three must pass, not just typecheck/build.

See also [[architecture]], [[data-model]], [[gotchas]].

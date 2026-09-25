---
name: pr-process
description: The one review-enforced rule for PRs in this repo — points to CLAUDE.md
type: convention
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - CLAUDE.md
  - RELEASE_NOTES.md
sources_sha256:
  CLAUDE.md: 08c9602e81556c0ea7c399981888ccdf1fe09556d10ed21d83c5c86e5e7b5574
  RELEASE_NOTES.md: 71729c3ebf945101cc6760ebe4bd64ab3cab115acb26754ffd78a10ec394d6cc
---

See `../../CLAUDE.md` for the mandatory-artifact rule: every PR must add a
bullet under `## Unreleased` in `../../RELEASE_NOTES.md`, or review rejects
it. That file exists pre-seeded with an empty `## Unreleased` section
(`../../RELEASE_NOTES.md`) — append a bullet there, don't recreate the
heading.

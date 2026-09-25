---
name: CLAUDE
description: Team claude-md rules from CLAUDE.md
type: convention
scope: global
updated: '2026-09-25'
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - CLAUDE.md
---

> Ingested verbatim from `CLAUDE.md` — the user-owned source of truth. Edit that file, not this page; this page is re-derived when the source changes.

# Code Review Rules

## Mandatory artifacts (review-enforced)

- **Every PR MUST add an entry to `RELEASE_NOTES.md`**: add a single
  bullet under the `## Unreleased` heading describing the change. A PR
  that does not modify `RELEASE_NOTES.md` must be REJECTED on review —
  cite `RELEASE_NOTES.md` as the file to fix.

*(Planted by j06.2 to force a deterministic iteration-1 rejection. The
file is pre-created below so the edit-only fixer can append to it rather
than create it. Both removed in test cleanup.)*

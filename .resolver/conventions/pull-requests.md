---
name: pull-requests
description: PR review requirements — release notes are mandatory, see CLAUDE.md
type: convention
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - RELEASE_NOTES.md
sources_sha256:
  RELEASE_NOTES.md: 71729c3ebf945101cc6760ebe4bd64ab3cab115acb26754ffd78a10ec394d6cc
---

The mandatory-artifact rule (every PR must add a bullet to
`RELEASE_NOTES.md`) is defined in [../../CLAUDE.md](../../CLAUDE.md) —
read it there, it is not duplicated here.

`RELEASE_NOTES.md` already exists with an `## Unreleased` heading and no
entries under it — a PR only needs to append one bullet under that
heading, not create the file or the heading.

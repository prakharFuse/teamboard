---
name: overview
description: What TeamBoard is and where to find the canonical docs — read this first
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - package.json
---

TeamBoard is a small internal team-directory app: Express + SQLite server, React (Vite) client. For project layout, commands, and the API surface, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate and current, so this overlay does not restate them.

Read next:
- [[architecture]] for the real request/data flow as a diagram
- [[data-model]] for the `members` table schema
- [[gotchas]] for behavior that isn't obvious from the docs (department validation status, CSV export, seed-data quirks)
- [[testing]] for the server test-runner pattern

One thing worth knowing up front: the single failing test in `server/src/routes/members.test.ts` (department validation, tracked as TM-105) is **intentional**, not a regression — see [[gotchas]] before "fixing" it away without adding real validation.

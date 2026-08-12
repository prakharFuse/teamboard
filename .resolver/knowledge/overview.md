---
name: overview
description: Read first — what TeamBoard is, and the one open ticket (TM-105) that shapes the codebase right now
type: knowledge
scope: global
updated: 2026-08-12 (IONE-959)
captured_sha: 1200413d009895f880bb480e9b74194c0f6b3934
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
---

TeamBoard is a small Express + React + SQLite team directory. For stack, layout,
commands, and the endpoint list, see `../../CLAUDE.md` and `../../README.md` —
both are accurate and there's no need to restate them here.

## TM-105 (department validation) has landed

`POST /api/members` and `PATCH /api/members/:id` (`server/src/routes/members.ts`)
now validate `department` against a fixed `VALID_DEPARTMENTS` allowlist and
reject unknown values with `400 { "error": ... }`. The three department tests
in `members.test.ts` ("rejects an invalid department" for POST and PATCH,
"accepts a valid department") all pass on `HEAD` now — there is no longer a
deliberately-red test in this suite. See `[[api-style]]` for the allowlist
itself and where to extend it if a new department is added.

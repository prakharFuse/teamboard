---
name: overview
description: Read first — what TeamBoard is, and the one open ticket (TM-105) that shapes the codebase right now
type: knowledge
scope: global
updated: '2026-08-12'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - CLAUDE.md
  - README.md
---

TeamBoard is a small Express + React + SQLite team directory. For stack, layout,
commands, and the endpoint list, see `../../CLAUDE.md` and `../../README.md` —
both are accurate and there's no need to restate them here.

## The one thing not in either doc: TM-105 is red on purpose

`server/src/routes/members.test.ts` contains a test, `POST /api/members rejects
an invalid department with 400`, that **fails on the current `HEAD`**. This is
intentional, not a broken build: `POST /api/members` (`server/src/routes/members.ts:26`)
inserts whatever `department` string the caller sends with no validation, and
the test asserts a 400 for an invalid one. The failure is CI's live signal for
ticket TM-105 (add department validation).

Implication for any future change: don't "fix" this by loosening the test's
assertion or deleting it — the fix belongs in `members.ts` (reject requests
whose `department` isn't a known value, respond `{ "error": ... }` with 400
per the existing error convention). Only once real validation exists should
the test start passing.

---
name: overview
description: What TeamBoard is, where things live, and gaps not covered by CLAUDE.md/README.md
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - CLAUDE.md
  - README.md
---

For project purpose, layout, commands, and the endpoint list, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate as of this writing.

## Gaps not covered by the existing docs

- **`POST /api/members` performs no department validation.** It inserts whatever `department` string the caller sends (`server/src/routes/members.ts:26-46`). `server/src/routes/members.test.ts` has an intentionally failing (RED) test, `POST /api/members rejects an invalid department with 400`, tracked as TM-105. If you're asked to add department validation, this is the test that should flip to green — don't reinterpret its presence as "already implemented."
- **`PATCH /api/members/:id` silently drops `start_date`.** The handler only destructures and updates `name`, `email`, `role`, `department` (`server/src/routes/members.ts:83-104`); a PATCH body containing `start_date` is ignored with no error. CLAUDE.md's "update member fields" is technically true but doesn't call out this omission.
- **No department allow-list exists anywhere in the codebase.** Seed data in `server/src/db.ts:37-44` uses ad hoc department strings, including two variants for the same team ("Engineering" and "Eng") — there is no canonical department enum to validate against yet.

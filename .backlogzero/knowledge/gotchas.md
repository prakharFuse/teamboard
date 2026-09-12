---
name: gotchas
description: Known gaps and sharp edges in the members API not documented in the README
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

**Department validation is missing (TM-105).** `POST /api/members` only checks
that `department` is present, never that it's a recognized value
(`members.ts:27-31`); `PATCH` doesn't validate it either (`members.ts:92-101`).
`server/src/routes/members.test.ts` already contains a red contract test for
this — `'POST /api/members rejects an invalid department with 400'`
(`members.test.ts:70-85`) — and `.github/workflows/ci.yml` documents that this
failure is intentional until TM-105 lands. Any change adding validation should
make that existing test go green rather than adding a parallel one — see
[data-model](data-model.md) for the `'Engineering'` vs `'Eng'` naming clash to
resolve first.

**CSV export doesn't escape fields.** `GET /api/members/export` builds rows
with a plain template-string join (`members.ts:52-54`) — no quoting or escaping
of commas, quotes, or newlines in `name`/`role`/`department`. A member name
containing a comma will silently shift columns in the downloaded CSV; this
isn't caught by any existing test.

**`Member`/`Stats` (client) and `MemberRow` (server) are hand-duplicated
interfaces**, not a shared type — see [architecture](architecture.md). Adding
or renaming a column requires updating both `App.tsx` and `members.ts` by hand.

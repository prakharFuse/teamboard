---
name: gotchas
description: Known sharp edges — the intentionally-red CI test, CSV export, and validation gaps
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## The department-validation test is intentionally red (TM-105)

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an
invalid department with 400`, that fails on `main` today: `POST
/api/members` (`server/src/routes/members.ts`) accepts any `department`
string and inserts it as-is — there is no allow-list or `CHECK` constraint.
The test and CI workflow comments both say this is deliberate, to give a PR
against this repo a real failing `pr_check` to fix (ticket TM-105). If asked
to "fix CI" or "make tests pass" here, the actual work is adding department
validation to the `POST` (and likely `PATCH`) handlers in `members.ts` — not
loosening or deleting the test.

`PATCH /api/members/:id` has the same gap: it accepts any `department` value
via `COALESCE`, with no validation at all.

## CSV export does not escape values

`GET /api/members/export` builds CSV by string-templating raw column values
with no quoting or escaping:
```
`${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
```
A comma or double-quote in `name`, `role`, or `department` (all free-text,
unvalidated) will silently shift columns in the downloaded file. This is
worth fixing alongside any `department` validation work, and is a good
candidate to flag if a `name`/`role` field ever gets comma-bearing input.

## Duplicated type shapes between client and server

`Member`/`Stats` in `client/src/App.tsx` and `MemberRow` in
`server/src/routes/members.ts` describe the same wire shape by hand, with no
shared source of truth — a field added to one will not raise a compile error
in the other.

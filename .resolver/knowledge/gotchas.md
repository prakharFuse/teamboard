---
name: gotchas
description: Known-red CI test, CSV export escaping, and PATCH field gaps — read before touching members.ts
type: knowledge
scope:
  - server/src/**
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

## The department-validation test is intentionally red

`server/src/routes/members.test.ts:70` asserts `POST /api/members` returns 400 for an invalid `department` string. As of this snapshot, `members.ts:26-46` performs no department validation — it inserts whatever string the caller sends and returns 201. This is called out explicitly in the test file's header comment as tracking ticket **TM-105**: the test is meant to stay RED until department validation is implemented, and CI (`.github/workflows/ci.yml`) runs it on every PR. If a task is about department handling, this is almost certainly the ticket to resolve — implement validation against a fixed set of allowed departments in the `POST` handler (and likely `PATCH`, which also writes `department` unchecked at `members.ts:98`).

## CSV export has no field escaping

`GET /api/members/export` (`members.ts:48-58`) builds CSV rows with a plain template-string join: `` `${r.id},${r.name},${r.email},...` ``. Any `name` or `department` containing a comma, quote, or newline will corrupt the CSV structure (and values starting with `=`/`+`/`-`/`@` are classic CSV-injection payloads in spreadsheet tools). There's no quoting/escaping logic anywhere in the file — this is a real gap, not a stylistic choice, if a task touches export.

## PATCH silently ignores `start_date` and `is_active`

`PATCH /api/members/:id` (`members.ts:83-104`) only accepts `name`, `email`, `role`, `department` from the body — `start_date` and `is_active` are not destructured or updated, so sending them is a silent no-op (no error, no effect). See [[data-model]] for why `is_active` is unused elsewhere too.

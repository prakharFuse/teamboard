---
name: gotchas
description: Non-obvious traps — the intentionally-red CI test and node:sqlite quirks
type: knowledge
scope: global
updated: '2026-09-01'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

## The failing CI test is intentional — don't "fix" it by weakening the test

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an
invalid department with 400`, that is **RED on `main` today by design**. The
test file's own header comment explains it's tracking ticket TM-105:
`POST /api/members` currently performs no department validation at all (see
[[data-model]]) and will insert any string, returning 201. The test asserts
400 and is written test-first, before the validation exists.

**How to apply:** if asked to make CI green, or to add department
validation, the correct fix is to add real validation to
`server/src/routes/members.ts` (e.g. an allow-list check before the
`INSERT`) — not to delete/loosen the test, and not to assume the feature
already exists because a test references it. CI (`.github/workflows/ci.yml`)
runs `pnpm typecheck && pnpm lint && pnpm test` on every PR and treats this
as a normal, currently-failing check.

## `node:sqlite` specifics

- `DatabaseSync` is synchronous — there's no connection pool and no
  async/await needed around queries. Don't wrap `db.prepare(...).run()` /
  `.get()` / `.all()` in promises; it adds nothing and obscures errors.
- Query results are typed `unknown` by the driver; every route casts through
  `as unknown as MemberRow` (or similar). This isn't defensive boilerplate
  to copy blindly — it's the only way TypeScript accepts the shape, since
  `node:sqlite`'s types don't carry column info.
- Tests isolate the DB via `process.env.TEAMBOARD_DB_PATH = ':memory:'`,
  set at module load time in `members.test.ts`, *before* any route handler
  runs. Because `getDb()` is a lazy singleton keyed off that env var read at
  first call, setting it later (e.g. inside a `test()` body, after another
  test already triggered `getDb()`) would silently no-op and hit the real
  `data/team.db` file instead.

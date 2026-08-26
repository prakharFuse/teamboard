---
name: overview
description: What TeamBoard is, its stack, and the one thing every change here must account for (the intentional RED test)
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

Stack and API surface are accurate in ../../README.md — see it for the route table and project layout. Don't duplicate that here.

## The one gotcha that matters most

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that is **intentionally failing on `main`**. `POST /api/members` (`server/src/routes/members.ts:26`) performs no validation on `department` — it inserts whatever string the caller sends. The test and `.github/workflows/ci.yml` both document this explicitly: it's tracked as **TM-105** and exists to give CI a real, readable failing check.

- If you're asked to add department validation, this is the ticket — implement it in `members.ts`'s `POST /` handler and the test should go green with no test-side changes needed.
- If you're working on anything else, don't "fix" this test as a drive-by — it's deliberately red until TM-105 lands.

## Test/build order

`pnpm test` runs `pnpm build && node --test "dist/server/**/*.test.js"` — tests execute against **compiled output**, not source. Editing `server/src/routes/members.ts` requires a rebuild before `node --test` will see the change; running `pnpm test` (not just `node --test dist/...`) handles that.

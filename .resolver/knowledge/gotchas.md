---
name: gotchas
description: Non-obvious runtime and CI behaviors in the members API — read before touching routes, CI, or the dev workflow
type: knowledge
scope: global
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - package.json
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## `POST /api/members` accepts any department string (intentional, tracked as TM-105)

`members.ts:26-46` inserts whatever `department` value is sent — there is no allow-list or validation. This isn't an oversight to silently fix in passing: `members.test.ts` has a test ("rejects an invalid department with 400") that is deliberately RED on `main` today, and `.github/workflows/ci.yml` exists specifically so PRs produce that real failing check. Only resolve this as part of landing TM-105's department validation — fixing it as a side effect of an unrelated change will look like the PR broke CI rather than fixed it.

## `DELETE /api/members/:id` hard-deletes despite an `is_active` column

`members.ts:106-117` runs `DELETE FROM members`, permanently removing the row. The schema has an `is_active` flag (server/src/db.ts:26) that `GET /api/members` already filters on (`WHERE is_active = 1`), but nothing ever sets `is_active = 0` — there's no soft-delete path today. A PATCH that flips `is_active` would look like a natural fit for the existing column but doesn't exist; don't assume "remove member" means soft-delete.

## `GET /api/members/export` does not escape CSV fields

`members.ts:48-58` joins raw `name`/`email`/`role`/`department` values with commas — a value containing a comma, quote, or newline will corrupt the CSV or shift columns. There's no injection sanitization (e.g. against formula injection like a leading `=`) either.

## `pnpm dev` does not rebuild on server source changes

`dev:server` (package.json:11) runs `node --watch dist/server/index.js` — it watches the **compiled** output, not `server/src/`. There is no `tsc --watch` in the `dev` pipeline, so editing `server/src/*.ts` while `pnpm dev` is running has no effect until you stop and re-run `pnpm build`.

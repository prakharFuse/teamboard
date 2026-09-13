---
name: overview
description: What TeamBoard is, its stack, and where things live — read first for orientation
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/db.ts
  - server/src/routes/members.ts
  - client/src/App.tsx
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

TeamBoard is an internal team-directory app (member CRUD, department stats, CSV export for HR).
Stack, project layout, API surface, and dev scripts are accurately described in `../../README.md` —
read that first; this page only covers what it doesn't.

## Gaps not covered by the README

- **Seed data has inconsistent department names.** `server/src/db.ts` seeds 8 members, but the
  `department` values are not normalized: most engineers use `'Engineering'` while David Kim and
  Hiro Tanaka use `'Eng'` (`server/src/db.ts:40,44`). `GET /api/members/stats` groups by the raw
  `department` string (`server/src/routes/members.ts:66`), so today it reports "Engineering" and
  "Eng" as two separate departments rather than one. Any department-validation work (see
  `server/src/routes/members.test.ts`, which has a currently-red test for this) needs to decide on
  a canonical department list and reconcile this seed data too.
- **`is_active` is schema-only right now.** The `members` table has an `is_active` column and
  `GET /api/members` filters on it, but `DELETE /api/members/:id` (`server/src/routes/members.ts:106-117`)
  does a hard `DELETE FROM members`, not a soft-deactivate. Nothing in the codebase ever sets
  `is_active = 0`. Don't assume "remove" is reversible or that `is_active` is currently exercised.
- **No department validation on write paths.** `POST /api/members` and `PATCH /api/members/:id`
  accept any non-empty `department` string with no allow-list check — see
  `[[data-model]]` for the schema and `[[api-conventions]]` for the resulting contract gap.

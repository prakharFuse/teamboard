---
name: overview
description: What TeamBoard is, tech stack, and the intentional red-CI gap around department validation
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - README.md
  - package.json
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` server, React/Vite client. See `../../README.md` for the tech stack table, API route table, and project layout — accurate as of this page.

There is no `pnpm-workspace.yaml`; despite the `server/` and `client/` split, this is a single `package.json` (not an npm/pnpm workspace). One `pnpm install` covers both.

## The repo ships with a deliberately failing CI check

`server/src/routes/members.test.ts` has a test, `'POST /api/members rejects an invalid department with 400'`, that is RED on `main`: `POST /api/members` (`server/src/routes/members.ts:26`) accepts any string as `department` and inserts it unvalidated. This is intentional — tracked as TM-105 — so that a PR against this repo has a real failing `pnpm test` check to fix, not a hypothetical one. `.github/workflows/ci.yml` runs `pnpm typecheck && pnpm lint && pnpm test` on every PR.

If asked to "fix CI" or "make tests pass" here, the fix is adding department validation to the `POST /api/members` handler (and likely `PATCH /api/members/:id`, `server/src/routes/members.ts:83`, which also writes `department` with no validation) — not editing or skipping the test.

There is no canonical list of valid departments anywhere in code today. Seed data in `server/src/db.ts:37-44` itself is inconsistent — it uses both `'Engineering'` and `'Eng'` as department values for different rows. Any validation work needs to pick/introduce the canonical set; don't assume one already exists.

## Tests need `TEAMBOARD_DB_PATH`

`server/src/db.ts:7` reads `TEAMBOARD_DB_PATH` to pick the SQLite file, defaulting to `data/team.db`. Tests set it to `':memory:'` (see `../conventions/testing.md`) — this must happen before the first `getDb()` call, since the module-level `db` singleton is created lazily and cached.

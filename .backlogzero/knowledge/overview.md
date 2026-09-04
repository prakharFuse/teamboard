---
name: overview
description: What TeamBoard is, tech stack, and where things live — read first
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. For tech stack, scripts, API endpoint table, and project structure, see `../../README.md` — it's accurate and doesn't need repeating here.

## Gaps not covered in the README

- **CI is intentionally red on `main`.** `server/src/routes/members.test.ts` has a test (`POST /api/members rejects an invalid department with 400`) that fails today because no department validation exists yet (tracked as TM-105 in the test's own comments). Don't treat a failing `pnpm test` as a regression you introduced — check whether it's this known-red test before investigating further. See [[gotchas]].
- **No department allow-list anywhere.** The `department` field on `POST`/`PATCH /api/members` is a free-text string end-to-end (plain `<input>` in `client/src/App.tsx`, no server check in `server/src/routes/members.ts`). Seed data even has inconsistent values (`'Engineering'` vs `'Eng'` for two different engineers in `server/src/db.ts`).
- **`PATCH /api/members/:id` only updates `name`, `email`, `role`, `department`.** It cannot change `start_date` or `is_active` — there's no route that ever flips `is_active`. See [[gotchas]] for why that matters.

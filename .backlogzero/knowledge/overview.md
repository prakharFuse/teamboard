---
name: overview
description: What TeamBoard is, tech stack, and where things live — read first
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 5635cd0b7f7bfd5a748edb97b564409088129f7d
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 66ad1e6fb359caeadc367ce0c6c3105764e8e91b0167bfa3533e4c3d2bea6b7b
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. For tech stack, scripts, API endpoint table, and project structure, see `../../README.md` — it's accurate and doesn't need repeating here.

## Gaps not covered in the README

- **`department` is now validated server-side against an allow-list, but only server-side.** `POST`/`PATCH /api/members` check `department` against `VALID_DEPARTMENTS` via `isValidDepartment()` in `server/src/routes/members.ts`, so `pnpm test`'s `rejects an invalid department with 400` case (previously tracked as TM-105, formerly red on `main`) now passes. The client's `department` field is still a plain free-text `<input>` in `client/src/App.tsx` — only the server enforces the allow-list.
- **The allow-list has aliases that pass validation but aren't normalized on write.** `DEPARTMENT_ALIASES` in `server/src/routes/members.ts` maps `'Eng'` → `'Engineering'` for the validation check only; the raw unaliased string is still what gets `INSERT`ed/`UPDATE`d. Seed data (`server/src/db.ts`) already has two engineers stored as `'Eng'` — that's why `/api/members/stats` still groups them separately from `'Engineering'`. See [[gotchas]].
- **`PATCH /api/members/:id` only updates `name`, `email`, `role`, `department`.** It cannot change `start_date` or `is_active` — there's no route that ever flips `is_active`. See [[gotchas]] for why that matters.

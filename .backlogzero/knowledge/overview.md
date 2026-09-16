---
name: overview
description: What TeamBoard is, how it runs, and where the tests/CI diverge from a plain read of the README
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/db.ts
  - server/src/index.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` server, React/Vite client. Stack, ports, scripts, and the API table are accurately documented in ../../README.md — read that first for the shape of the app.

## Gaps not covered by the README

**The DB handle is a lazy, per-process singleton.** `getDb()` in `server/src/db.ts:11` creates the `DatabaseSync` connection on first call and caches it in a module-level `db` variable. The DB path is fixed by `TEAMBOARD_DB_PATH` (or defaults to `data/team.db`) at the time of that first call — setting the env var later has no effect. This is why `members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time, before any route is exercised.

**`pnpm test` runs against compiled output, not source.** The script is `pnpm build && node --test "dist/server/**/*.test.js"` (package.json:16) — it compiles server TypeScript first, then runs Node's built-in test runner on the emitted `.js`. There is no client-side test suite; only `server/src/routes/members.test.ts` exists.

**CI has one intentionally-red check.** `server/src/routes/members.test.ts` and `.github/workflows/ci.yml` both carry comments explaining that `POST /api/members rejects an invalid department with 400` fails on `main` today, because `members.ts` performs no department validation. This is deliberate (ticket TM-105) so that PRs against this repo have a real failing CI check to fix. See [[known-issues]] before treating a red `pnpm test` as a regression.

**Dev-mode API access relies on the Vite proxy.** The client calls relative paths like `fetch('/api/members')` (`client/src/App.tsx:30`). This only resolves to the server in dev because `client/vite.config.ts` proxies `/api` → `http://localhost:4060`. There is no production static-serving or reverse-proxy setup in this repo — `pnpm start` only runs the compiled server; something else (not present here) would need to serve the built client and route `/api` to it in production.

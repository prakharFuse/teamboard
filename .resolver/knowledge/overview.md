---
name: overview
description: What TeamBoard is and where things live — read first for orientation
type: knowledge
scope: global
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - server/src/db.ts
  - client/src/App.tsx
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. See `../../README.md` and `../../CLAUDE.md` for the project layout, command list, and endpoint table — those are accurate and don't need restating here.

## Gaps not covered by CLAUDE.md / README

- The client (`client/src/App.tsx`) is a single component holding all state (members, stats, add-member form) — there is no router, no component split, and no client-side data layer beyond raw `fetch` calls to `/api/members*`.
- `server/src/index.ts` is the entire Express app wiring: `cors()` + `express.json()` + mount `membersRouter` at `/api/members`, then `app.listen`. There's nothing else registered (no auth, no other routers).
- `getDb()` in `server/src/db.ts` is a lazy singleton: the first call creates the file (or `:memory:`), runs `CREATE TABLE IF NOT EXISTS`, and seeds 8 rows only if the table is empty. Every subsequent call reuses the same `DatabaseSync` handle for the process lifetime — there is no way to re-seed or reset without restarting the process (or, in tests, using a fresh `:memory:` DB per process).

See [[architecture]] for how the pieces connect, [[data-model]] for the schema, and [[gotchas]] for behavior that looks like a bug but is either intentional or just under-implemented.

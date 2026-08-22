---
name: overview
description: What TeamBoard is and where to find the canonical project facts
type: knowledge
scope: global
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - .github/workflows/ci.yml
  - server/src/routes/members.test.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  CLAUDE.md: 4a4c5b4ece44e69fe1e5d6f0849feef9461f2acc275a1c6c8341b62405e118ec
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

TeamBoard is a small Express + SQLite + React internal team directory. For
project layout, commands, and the endpoint list, see ../../CLAUDE.md and
../../README.md — both are accurate and up to date with the code.

## Known-red CI check (not documented anywhere else)

`server/src/routes/members.test.ts` has a test — `POST /api/members rejects an
invalid department with 400` — that is **intentionally failing on `main`**.
`POST /api/members` (server/src/routes/members.ts) performs no validation on
the `department` field; it inserts whatever string is sent. The test and
`.github/workflows/ci.yml` both call this out in comments as tracking ticket
**TM-105** (add department validation). If you're asked to fix CI or land a
PR here, this is very likely the check in question — resolving it means
constraining `department` to a known set (or otherwise validating it) in the
POST handler, not touching the test.

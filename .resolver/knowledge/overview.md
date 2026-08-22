---
name: overview
description: What TeamBoard is, where things live, and the in-flight ticket (TM-105) that shapes current CI state
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
  - server/src/db.ts
---

TeamBoard is a small internal team-directory app: Express + `node:sqlite` API, React/Vite client. For the file layout, `pnpm` scripts, and the endpoint list, see [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — both are accurate against the current code and there's no need to restate them here.

## The one thing not in either doc: CI is intentionally red right now

`server/src/routes/members.test.ts` ships a test, `POST /api/members rejects an invalid department with 400`, that fails on `main` today. `POST /api/members` (`server/src/routes/members.ts:26-46`) performs no validation on the `department` field at all — it inserts whatever string the caller sends. The test and `.github/workflows/ci.yml` both call this out explicitly as a deliberate red check tracked as **TM-105** (add department validation), left in place so PRs have a real failing `pr_check` to fix. If you're asked to work on department validation, this is the ticket and this is the test that should flip green — don't treat the failure as pre-existing breakage to route around.

## Seed data already has the bug TM-105 needs to prevent

The seed rows in `getDb()` (`server/src/db.ts:37-44`) use two different strings for the same team: `'Engineering'` (Alice Chen) and `'Eng'` (David Kim, Hiro Tanaka). Because `GET /api/members/stats` groups by the literal `department` column value (`server/src/routes/members.ts:65-67`), the stats sidebar currently renders "Engineering" and "Eng" as two separate departments. Any department-validation fix should also decide what happens to this pre-existing inconsistent data — a whitelist on `POST` alone won't reconcile the seed rows.

See also [[gotchas]] for further code-verified traps, [[architecture]] for the request flow, and [[data-model]] for the `members` schema.

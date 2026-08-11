---
name: overview
description: What TeamBoard is and where things live — read first for orientation
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
  - README.md
---

TeamBoard's stack, layout, commands, and endpoint list are already documented accurately in
[../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) — see those for the
canonical rundown rather than duplicating it here.

This page only adds what those docs don't cover.

## Known outstanding work: TM-105 (department validation)

`POST /api/members` performs no validation on the `department` field — any string is accepted
and inserted (`server/src/routes/members.ts:26-46`). This is intentional and tracked: the test
`server/src/routes/members.test.ts` has a test, "POST /api/members rejects an invalid department
with 400", that is currently RED on `main` by design, and `.github/workflows/ci.yml` runs it on
every PR. Both files carry comments explaining this is deliberate scaffolding for TM-105, not a
forgotten bug.

**If asked to add department validation:** the fix belongs in the `POST /api/members` handler
(and arguably `PATCH /api/members/:id`, which currently accepts any department string too). See
[[gotchas]] for the existing seed-data department inconsistency that any validation logic needs
to account for.

## Route ordering matters

In `server/src/routes/members.ts`, `/export` and `/stats` are registered *before* `/:id`
(`router.get('/export', ...)` and `router.get('/stats', ...)` precede `router.get('/:id', ...)`).
Express matches routes in registration order, so this ordering is load-bearing — a new
fixed-segment GET route added after `/:id` would be swallowed by the `:id` param route instead.
New member sub-routes should be added above the `/:id` handlers.

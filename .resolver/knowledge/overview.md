---
name: overview
description: What TeamBoard is, where the stack/endpoint docs live, and the one CI fact those docs don't mention
type: knowledge
scope: global
updated: 2026-08-12 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - CLAUDE.md
  - README.md
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
---

For stack, layout, commands, and the full endpoint list, see [../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) — both are accurate and current.

## Gap: CI is intentionally red right now

Neither doc mentions this, but it governs any PR against this repo. `server/src/routes/members.test.ts` has a test — `POST /api/members rejects an invalid department with 400` — that fails on `main` **by design**. `POST /api/members` (`server/src/routes/members.ts:26`) performs no department validation today, so any string is accepted and the endpoint returns 201. The test file's own header comment explains this is deliberate: it gives Resolver's Fix-CI/Refine-PR flow a genuine failing check tied to ticket TM-105 (add department validation).

**Implication:** don't "fix" this by deleting or loosening the test. The correct fix is to add department validation to `POST /api/members` (and likely `PATCH /api/members/:id`, which currently accepts the same unvalidated `department` field) so the test goes green. See [[gotchas]] for the related seed-data inconsistency that motivates this.

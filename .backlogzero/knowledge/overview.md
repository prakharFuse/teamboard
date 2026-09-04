---
name: overview
description: What TeamBoard is, tech stack, and where to look first — read before making any change
type: knowledge
scope: global
updated: '2026-09-04'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team directory (member profiles, departments, HR CSV export). Tech stack, API routes, project layout, and dev scripts are documented in [README.md](../../README.md) — that page is accurate and current, refer to it rather than duplicating it here.

Gaps the README doesn't cover:

- **Runtime requirement is load-bearing, not just a version bump.** `server/src/db.ts:1` imports `node:sqlite` (the built-in `DatabaseSync`), which only exists in Node ≥ 22.5. There is no fallback driver — running on an older Node fails at import time, not at a friendly startup check.
- **No ORM/migration tool.** Schema lives entirely in the `CREATE TABLE IF NOT EXISTS` string in `server/src/db.ts:18`. Schema changes are made by hand-editing that string; there's no migration history to reconcile.
- **Single shared `DatabaseSync` instance.** `getDb()` (`server/src/db.ts:11`) lazily creates one module-level `db` and returns it on every call — there's no connection pool or per-request handle.

See also [[architecture]] for how client/server/db fit together, [[data-model]] for the schema, and [[gotchas]] for behavior that looks like a bug but is either intentional or a real divergence from the README.

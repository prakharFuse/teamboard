---
name: overview
description: What TeamBoard is and where to find layout/endpoint/command docs
type: knowledge
scope: global
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - package.json
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
---

TeamBoard is an Express + React + SQLite team directory. For project layout, npm scripts,
and the endpoint list, see [../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) —
both are accurate and up to date with the code.

## Gaps not covered by the customer docs

- **DB path resolution**: `getDb()` (`server/src/db.ts:7`) defaults to `<cwd>/data/team.db`,
  overridable via `TEAMBOARD_DB_PATH` (tests set this to `:memory:`). Neither CLAUDE.md nor
  the README mentions the env var override.
- **Seed data** is only inserted once, guarded by a `COUNT(*) === 0` check (`db.ts:32-45`) —
  it will not re-seed an existing non-empty `data/team.db`.
- **Server port** defaults to `4060` via `process.env.PORT` (`server/src/index.ts:6`); the
  README's "port 4060" is the default, not a hardcoded value.

See [gotchas](gotchas.md) for behavior that diverges from what the docs imply.

---
name: overview
description: Entry point for the .resolver overlay — start here, then follow links for architecture, data model, and gotchas
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - CLAUDE.md
---

Project layout, commands, endpoints, and API error conventions are accurately documented in ../../CLAUDE.md and ../../README.md — read those first, this overlay doesn't repeat them.

This overlay adds:
- [[architecture]] — request flow / process wiring (client proxy, Express, SQLite) as a diagram
- [[data-model]] — the single `members` table schema
- [[gotchas]] — traps found by reading the code that no doc mentions, including a **currently-intentional red CI check** for TM-105
- [[testing]] — server test conventions (`node:test`, in-memory DB, tests run against `dist/`)

One easy-to-miss constraint: `package.json` pins `"engines": { "node": ">=22.5.0" }` because `server/src/db.ts` uses `node:sqlite`, which only exists from Node 22.5 onward — an older Node in a dev/CI environment will fail at import time, not with a clear "unsupported" error.

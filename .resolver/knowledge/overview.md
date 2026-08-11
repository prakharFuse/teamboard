---
name: overview
description: What TeamBoard is and where to find the canonical layout/commands docs
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - client/vite.config.ts
---

TeamBoard is a small internal team directory: Express + `node:sqlite` API, React/Vite client. For project layout, commands, and the endpoint list, see [../../CLAUDE.md](../../CLAUDE.md) and [../../README.md](../../README.md) — both are accurate and don't need restating here.

This page only adds what those docs don't cover: see [architecture.md](architecture.md) for the request-flow diagram, [data-model.md](data-model.md) for the schema, and [gotchas.md](gotchas.md) for code-verified behavior the docs gloss over (route ordering, delete semantics, CSV escaping).

There is one active workstream worth knowing about before touching `POST /api/members`: `server/src/routes/members.test.ts` ships with an intentionally red test (`rejects an invalid department with 400`) tied to ticket TM-105 — department validation doesn't exist yet in `members.ts`. See [gotchas.md](gotchas.md) for detail.

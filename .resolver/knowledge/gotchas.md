---
name: gotchas
description: Derived, code-verified quirks in the members API not mentioned in CLAUDE.md/README
type: knowledge
scope:
  - server/src/**
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
  - server/src/routes/members.ts
  - package.json
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **`DELETE /api/members/:id` is a hard delete, not soft.** The `members`
  table has an `is_active` column and `GET /api/members` filters on
  `is_active = 1` (routes/members.ts:21), which reads like a soft-delete
  design — but nothing in the codebase ever sets `is_active` to 0. The
  DELETE handler runs `DELETE FROM members WHERE id = ?`
  (routes/members.ts:115), permanently removing the row. `is_active` is
  effectively dead weight today; don't assume "deleted" members are
  recoverable.

- **`PATCH /api/members/:id` silently drops `start_date` and `is_active`.**
  Only `name`, `email`, `role`, and `department` are read from the body
  (routes/members.ts:92-101) via `COALESCE`; any other field in the request
  is ignored with no error. CLAUDE.md's "update member fields" doesn't say
  which fields, so this isn't a contradiction — just easy to miss.

- **CSV export does not escape values.** `GET /api/members/export`
  (routes/members.ts:52-54) joins raw column values with commas/newlines. A
  `name` or `role` containing a comma, quote, or newline will silently
  corrupt the CSV. No sanitization exists anywhere in the export path.

- **`pnpm dev` requires a prior `pnpm build`.** `dev:server` runs
  `node --watch dist/server/index.js` (package.json) — it does not compile
  TypeScript itself. Running `pnpm dev` on a clean checkout without first
  running `pnpm build` starts a client with no working API (module not
  found). README's "Getting started" happens to list `build` before `dev`,
  but CLAUDE.md's command list doesn't state the ordering dependency.

- **`POST /api/members` has no `department` validation** — see
  ../overview.md for the TM-105 context; this is intentional and tracked,
  not an oversight to "fix" incidentally while touching unrelated code.

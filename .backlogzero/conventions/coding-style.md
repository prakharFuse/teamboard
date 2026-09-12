---
name: coding-style
description: Lint/type-check setup and route-handler conventions for the Express API
type: convention
scope:
  - server/**
  - client/**
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - eslint.config.mjs
  - server/tsconfig.json
  - server/src/routes/members.ts
sources_sha256:
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

Lint is `typescript-eslint` recommended config only (`eslint.config.mjs:4-8`) — no Prettier, no custom rule overrides, `dist/`, `node_modules/`, and `data/` ignored. `pnpm lint` runs `eslint .` across the whole repo (client + server) in one pass.

Both `server/tsconfig.json` and `client/tsconfig.json` use `strict: true`. `pnpm typecheck` runs both projects separately (`package.json:14`) — a change that type-checks on one side won't necessarily type-check on the other; run the full script, not just one `tsc -p`.

Route handlers in `members.ts` share a consistent shape: fetch via `getDb()`, `db.prepare(...).get()/.all()/.run()` cast through `as unknown as <RowType>` (raw `DatabaseSync` results are untyped), then guard not-found before mutating. New routes should follow this same not-found-guard-then-mutate order (see `PATCH`/`DELETE` handlers, `members.ts:83-117`) rather than trusting `req.params.id` without a lookup.

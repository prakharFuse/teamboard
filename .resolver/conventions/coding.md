---
name: coding
description: TypeScript/route conventions for TeamBoard's server and client
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Both `server/tsconfig.json` and `client/tsconfig.json` have `"strict":
  true`. Server compiles with `module`/`moduleResolution: NodeNext` (hence
  relative imports use explicit `.js` extensions, e.g. `from
  '../db.js'`); client uses `moduleResolution: bundler` (no extension
  needed). Don't mix these import styles across the boundary.
- Lint is flat-config ESLint (`eslint.config.mjs`) with
  `typescript-eslint` recommended rules — no Prettier config present, so
  don't assume a formatter will run; match surrounding style by hand.
- Route handlers in `server/src/routes/members.ts` all: fetch `getDb()`
  first, cast query results with `as unknown as <RowType>`, and respond with
  `res.status(...).json(...)` — follow this shape for new routes rather than
  introducing a different error-response format.
- Partial updates use `COALESCE(?, column)` in the `UPDATE` statement so
  omitted body fields keep their existing value — new updatable fields
  should extend this same `COALESCE` pattern, not a separate dynamic
  query-builder.
- No comments in the existing route/component code beyond the one
  explanatory comment in `db.ts` about `TEAMBOARD_DB_PATH`; match that
  sparse style rather than adding narrative comments to new handlers.

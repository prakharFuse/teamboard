---
name: code-style
description: Lint/type-check setup and route-handler conventions used across the server
type: convention
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - eslint.config.mjs
  - server/src/routes/members.ts
  - server/tsconfig.json
  - client/tsconfig.json
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Lint is flat-config ESLint (`eslint.config.mjs`) using `@eslint/js` recommended + `typescript-eslint` recommended, with `dist/`, `node_modules/`, `data/` ignored. Run `pnpm lint` before committing; CI runs it too (`.github/workflows/ci.yml`).
- Both `server/tsconfig.json` and `client/tsconfig.json` have `"strict": true` — new code must type-check under strict mode, no implicit `any`.
- Route handlers in `server/src/routes/members.ts` follow a consistent shape: fetch row(s) with `getDb().prepare(...).get/all()`, cast the untyped `node:sqlite` result with `as unknown as <RowType>`, then respond with `res.json(...)` or a `res.status(n).json({ error })`. Follow this cast pattern (`as unknown as X`, not a direct `as X`) for new queries since `node:sqlite`'s return type is loosely typed.
- Not-found handling is uniform: look up by id, `if (!row) { res.status(404).json({ error: '...' }); return; }` before any further logic — replicate this for new `:id` routes rather than throwing.

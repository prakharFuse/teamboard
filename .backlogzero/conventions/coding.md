---
name: coding
description: TypeScript/module conventions, lint setup, and the double-cast pattern used for node:sqlite results
type: convention
scope: global
updated: '2026-09-04'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
  - server/src/routes/members.ts
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Both `server/tsconfig.json` and `client/tsconfig.json` use `"strict": true`. Server uses `module`/`moduleResolution: "NodeNext"` with explicit `.js` extensions on relative imports (e.g. `import { getDb } from '../db.js'` in `server/src/routes/members.ts:2`, even though the source file is `db.ts`) — this is required by NodeNext ESM resolution, keep the `.js` suffix on new relative imports in `server/src/**`. Client uses `moduleResolution: "bundler"` (Vite), where extension-less imports are fine.
- ESLint is the flat-config format (`eslint.config.mjs`) built on `@eslint/js` recommended + `typescript-eslint` recommended, with no project-specific rule overrides — new code should pass `pnpm lint` under the stock recommended rule sets, not a customized ruleset.
- `node:sqlite`'s `.get()`/`.all()` return loosely-typed rows, so every query result is cast via `as unknown as <Row>` (e.g. `server/src/routes/members.ts:22`, `:37`, `:64`, `:75`) rather than a direct `as`. Follow this double-cast pattern for new queries instead of widening the row types or using `any`.
- Route handlers are typed `(req: Request, res: Response): void` and return early after `res.status(...).json(...)` rather than using `return res...` chains (see every handler in `server/src/routes/members.ts`) — keep that shape (explicit `void` return, `return;` on its own line after sending an error response) for new routes.

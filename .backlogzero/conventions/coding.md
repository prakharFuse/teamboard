---
name: coding
description: TypeScript/route/import conventions specific to this repo's server and client split
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
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

- Both `server/` and `client/` tsconfigs use `strict: true` — new code should type-check cleanly under strict mode, not lean on `any`/`as unknown as` beyond the existing pattern for `node:sqlite` row casts (`db.prepare(...).get() as unknown as MemberRow`), which exists because `node:sqlite` returns untyped rows.
- Server imports use explicit `.js` extensions on relative paths (`NodeNext` module resolution) — e.g. `import { getDb } from '../db.js'`. Client imports use bundler resolution and do the same for consistency (`import App from './App.js'` in `main.tsx`) even though Vite doesn't require it. Match whichever convention the surrounding file already uses.
- Express route handlers are typed explicitly as `(req: Request, res: Response): void` and return early after sending a response (`res.status(400).json(...); return;`) rather than using `res.status().json()` as the final expression — follow this shape for new handlers in `members.ts` or any new router.
- Lint config (`eslint.config.mjs`) is `@eslint/js` recommended + `typescript-eslint` recommended, flat config, no repo-specific rule overrides — nothing unusual to account for beyond standard TS-ESLint recommendations.
- No CSS framework: `client/src/styles.css` is hand-written, plain class names (`.app`, `.toolbar`, `.dept-badge`, etc.) — follow that naming style for new UI, not utility classes or CSS modules.

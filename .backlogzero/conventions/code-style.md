---
name: code-style
description: TypeScript/module conventions used across server and client
type: convention
scope: global
updated: 2026-09-04 (IONE-959)
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

- Whole repo is ESM (`"type": "module"` in `package.json`). Server uses `NodeNext`/`NodeNext` module resolution (`server/tsconfig.json`), so relative imports between server files use explicit `.js` extensions even in `.ts` source (e.g. `import { getDb } from '../db.js'` in `server/src/routes/members.ts:2`) — this is required by `NodeNext`, not a typo.
- Both `server/tsconfig.json` and `client/tsconfig.json` have `strict: true`. Keep new code strict-clean rather than adding `any`/non-null assertions to route around it.
- Lint is flat-config ESLint (`eslint.config.mjs`) using `@eslint/js` recommended + `typescript-eslint` recommended, with only `dist/`, `node_modules/`, `data/` ignored. `pnpm lint` runs against the whole repo (`eslint .`), including `client/`.
- Express route handlers in `members.ts` consistently type as `(req: Request, res: Response): void =>`, use early `return;` after sending an error response (never `return res.json(...)`), and cast raw `node:sqlite` query results with `as unknown as <RowType>` rather than trusting driver typings directly. Follow this shape for new routes.

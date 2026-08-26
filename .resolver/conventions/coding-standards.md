---
name: coding-standards
description: TS module/import and route-handler conventions for server and client code
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - server/tsconfig.json
  - server/src/index.ts
  - server/src/routes/members.ts
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- **Server imports use explicit `.js` extensions**, even though the source
  files are `.ts`: `server/tsconfig.json` sets `module`/`moduleResolution`
  to `NodeNext`, which requires the extension the compiled output will
  actually have. See `server/src/index.ts:3`
  (`from './routes/members.js'`) and `server/src/routes/members.ts:2`
  (`from '../db.js'`). New server-side relative imports must follow this —
  `from './foo'` will fail typecheck/build under `NodeNext`.

- **Route handlers are explicitly typed** `(req: Request, res: Response): void`
  and use an early `return` after sending an error response, rather than
  `if/else` branching (see every handler in `server/src/routes/members.ts`).
  Follow this shape for new routes.

- **Raw `node:sqlite` results are cast via `as unknown as <Interface>`**
  (e.g. `server/src/routes/members.ts:22`, `:37`, `:64`) since the sqlite
  bindings don't carry row types — mirror this cast pattern for new
  queries instead of introducing `any`.

- Both `server/tsconfig.json` and `client/tsconfig.json` have `strict: true`
  — keep new code type-safe without loosening either config.

- Lint is ESLint's flat config (`eslint.config.mjs`) using
  `typescript-eslint` recommended rules, ignoring `dist/`, `node_modules/`,
  `data/`. Run `pnpm lint`; CI fails the build if it doesn't pass (see
  [[overview]]).

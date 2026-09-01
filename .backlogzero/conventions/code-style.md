---
name: code-style
description: TypeScript/ESM conventions actually followed in server and client code
type: convention
scope: global
updated: '2026-09-01'
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

- Both `tsconfig.json`s have `"strict": true` — no implicit `any`, and the
  codebase leans on explicit return types for exported functions (e.g.
  `function getDb(): DatabaseSync`, route handlers typed
  `(req: Request, res: Response): void`). Match this on new functions.
- The whole repo is ESM (`"type": "module"` in `package.json`). Relative
  imports use explicit `.js` extensions even from `.ts`/`.tsx` source files
  (`from '../db.js'`, `from './App.js'`) — this is required by `NodeNext`
  module resolution on the server side, and kept for consistency on the
  client side too. Don't drop the extension or use `.ts`.
- Error responses from the API are a consistent `{ error: string }` JSON
  shape with an appropriate status code (400 for missing fields, 404 for
  not-found, 409 for unique-constraint conflicts) — see the handlers in
  `server/src/routes/members.ts`. New endpoints should follow this shape
  rather than inventing a new error format.
- `eslint.config.mjs` uses flat config with only
  `@eslint/js` recommended + `typescript-eslint` recommended — no
  stylistic/formatting rules (no Prettier config in the repo), so lint
  failures will be about correctness (unused vars, etc.), not formatting.

---
name: coding
description: TypeScript/module conventions for server and client code
type: convention
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Both `server/tsconfig.json` and `client/tsconfig.json` have `strict: true`
  — new code must type-check under strict mode, no implicit `any`.
- **Server is NodeNext ESM**: relative imports use explicit `.js` extensions
  even though the source is `.ts` (e.g. `import { getDb } from '../db.js'`
  in `server/src/routes/members.ts:2`). Keep this pattern for any new
  server file; omitting the extension breaks `NodeNext` module resolution.
- **Client uses `bundler` moduleResolution** with `jsx: react-jsx`; Vite
  handles extension-less imports for `.tsx`, but cross-file `.ts`/`.tsx`
  imports of local modules still carry a `.js` suffix by convention here
  too (`client/src/main.tsx:3` imports `./App.js`) — match this rather than
  mixing extension styles within the client.
- Lint is a flat ESLint config (`eslint.config.mjs`) built from
  `@eslint/js` recommended + `typescript-eslint` recommended, with
  `dist/`, `node_modules/`, `data/` ignored. `pnpm lint` runs `eslint .`
  with no server/client split — one config for the whole repo.
- Route handlers in `members.ts` follow a consistent shape: fetch the row
  by id first, `404` if missing, then perform the mutation — new handlers
  on the same router should follow that lookup-then-act order rather than
  relying on SQLite's own "0 rows affected" signal.

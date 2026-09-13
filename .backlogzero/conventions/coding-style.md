---
name: coding-style
description: TypeScript/ESM conventions this repo follows — NodeNext imports, strict mode, flat ESLint config
type: convention
scope: global
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
  - package.json
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- **Relative imports use `.js` extensions even in `.ts` source files.** Both server (`module`/`moduleResolution: NodeNext`) and the top-level `"type": "module"` require this — e.g. `import { getDb } from '../db.js'` (`server/src/routes/members.ts:2`) for a file that is actually `db.ts`. This is not a typo pattern to "fix"; omitting the extension breaks `tsc` under `NodeNext`.
- **`strict: true` in both `server/tsconfig.json` and `client/tsconfig.json`** — new code should type-check cleanly under strict mode, no implicit `any`.
- **Client uses `moduleResolution: "bundler"` and `module: "ESNext"`**, distinct from the server's `NodeNext` — this is why `client/src/main.tsx:3` imports `'./App.js'` for `App.tsx` too (Vite/bundler resolution still expects the `.js` suffix here per the `.tsx`→`.js` convention already in use), but the *resolution algorithm* differs from the server, so don't assume server and client tsconfigs are interchangeable when adding shared code.
- **ESLint is flat config** (`eslint.config.mjs`) using `typescript-eslint`'s `recommended` preset plus `@eslint/js` recommended — no legacy `.eslintrc`. `dist/`, `node_modules/`, and `data/` are ignored.
- **`server/tsconfig.build.json` extends `server/tsconfig.json`** and only turns off `declaration`/`declarationMap`/`sourceMap` for the production build (`pnpm build`) — `pnpm typecheck` uses the base `tsconfig.json` (with those on) for both server and client. If you add compiler options, decide whether they belong in the base config (checked by both `typecheck` and `build`) or only one.

---
name: code-style
description: ESM/NodeNext import conventions, strict TS, and the flat ESLint config with no project-specific rules
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
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

`package.json` has `"type": "module"`; the server uses `module`/`moduleResolution: NodeNext` (`server/tsconfig.json`). That means relative imports in `server/src/**` must include the `.js` extension even though the source files are `.ts` (e.g. `server/src/index.ts:3` imports `'./routes/members.js'`, `members.ts:2` imports `'../db.js'`). The client uses `moduleResolution: bundler` (`client/tsconfig.json`) and does not need this — don't copy the `.js`-suffix convention into `client/src/**` imports.

Both tsconfigs have `strict: true`. There's a separate `server/tsconfig.build.json` (extends `server/tsconfig.json`, turns off `declaration`/`sourceMap`) used only by the `build` script — `typecheck` uses the base `server/tsconfig.json` directly.

`eslint.config.mjs` is `js.configs.recommended` + `tseslint.configs.recommended` only, with no custom or stricter rules added and no per-directory overrides — don't assume house rules (e.g. import ordering, naming conventions) beyond what those two shared configs enforce. `data/`, `dist/`, `node_modules/` are ignored.

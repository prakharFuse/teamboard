---
name: coding
description: TypeScript/module conventions for server and client code
type: convention
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Server uses `NodeNext` module resolution (`server/tsconfig.json:4-5`): relative imports must use explicit `.js` extensions even though the source is `.ts` (e.g. `import { getDb } from '../db.js'` in `members.ts:2`). Client uses `bundler` resolution (`client/tsconfig.json:5`) and follows the same `.js`-suffix import style for consistency (`main.tsx:3`), though Vite doesn't require it.
- Both tsconfigs have `strict: true` — don't add `any`-widening escape hatches; existing code uses explicit `unknown` + `as` casts for `node:sqlite` results (e.g. `members.ts:22,32,37`) since `node:sqlite` has no typed row generics.
- Lint is `eslint.config.mjs` — flat config, `@eslint/js` recommended + `typescript-eslint` recommended, only ignoring `dist/`, `node_modules/`, `data/`. No custom rule overrides exist; don't add stricter/looser rules without discussing, since none are currently configured.
- Route handlers in `members.ts` follow a consistent shape: destructure body → validate presence → `getDb()` → prepare/run → respond. New endpoints should match this (no service/repository layer exists to route logic through instead).

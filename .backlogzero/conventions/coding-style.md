---
name: coding-style
description: Module system, import extensions, and lint/type-check setup for both server and client
type: convention
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

Whole repo is ESM (`"type": "module"` in package.json). Server uses `module`/`moduleResolution: NodeNext` (`server/tsconfig.json:4-5`), which means relative imports must use the compiled `.js` extension even in `.ts` source — e.g. `import { getDb } from '../db.js'` (`server/src/routes/members.ts:2`), `import App from './App.js'` in the client's `main.tsx:3`. Keep using `.js` on relative imports when adding new server or client entry files; leaving it off is a compile error under `NodeNext`.

Client uses `moduleResolution: bundler` (`client/tsconfig.json:5`) via Vite, and is type-checked separately from the server: `pnpm typecheck` runs `tsc -p server/tsconfig.json --noEmit && tsc -p client/tsconfig.json --noEmit` (package.json:14) — two independent project configs, no shared `tsconfig.base.json`.

Lint is flat-config ESLint (`eslint.config.mjs`) with `@eslint/js` recommended + `typescript-eslint` recommended, no custom rule overrides — don't add repo-specific rule tweaks without checking whether the plain recommended sets already cover the case.

`server/tsconfig.build.json` extends `server/tsconfig.json` and only turns off `declaration`/`declarationMap`/`sourceMap` for the emitted build (package.json's `build` script uses this one, not the base config) — if you need new compiler options for the server, add them to `server/tsconfig.json` so both typecheck and build pick them up, not just one.

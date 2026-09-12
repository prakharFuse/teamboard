---
name: coding
description: TypeScript/module conventions — NodeNext ESM imports, strict mode, lint config
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
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

- Server uses `module`/`moduleResolution: NodeNext` — relative imports must use explicit `.js` extensions even though the source is `.ts` (e.g. `import { getDb } from '../db.js'` in `members.ts`). Client uses `moduleResolution: bundler` (Vite), where `.js`-suffixed relative imports are also used for consistency (see `main.tsx` importing `App.js`) but are not required by the resolver.
- Both `server/tsconfig.json` and `client/tsconfig.json` have `strict: true` — don't introduce `any` or disable strict checks locally to unblock a change.
- `server/tsconfig.build.json` extends the base server config only to drop `declaration`/`declarationMap`/`sourceMap` for the emitted build; compiler options otherwise match `tsconfig.json` — keep new server compiler options in `tsconfig.json` so both typecheck and build stay in sync.
- Lint is `eslint.config.mjs` using `@eslint/js` recommended + `typescript-eslint` recommended, no project-specific rule overrides — don't add new lint rules without discussing scope, since none exist today to extend.

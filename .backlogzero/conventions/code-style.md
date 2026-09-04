---
name: code-style
description: Module resolution quirks and lint config — read before adding new server/client files
type: convention
scope: global
updated: 2026-09-04 (IONE-959)
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

- **Server uses `NodeNext` module resolution — imports must use `.js` extensions even though the source files are `.ts`.** E.g. `server/src/routes/members.ts` imports `from '../db.js'` (the actual file is `db.ts`). New server files must follow this or `tsc` will fail to resolve the import at build.
- **Client uses `bundler` module resolution** (`client/tsconfig.json`), where `main.tsx` imports `from './App.js'` for the actual `App.tsx` — Vite/bundler resolution rewrites this. Same `.js`-extension-on-import convention as the server, for consistency, even though the mechanism differs.
- **Both `tsconfig.json`s have `strict: true`.** No relaxed-strictness escape hatches exist for new code.
- **Lint is a single flat `eslint.config.mjs`** covering both `server/` and `client/` with `@eslint/js` recommended + `typescript-eslint` recommended, ignoring `dist/`, `node_modules/`, `data/`. There's no per-package eslint config — don't add one.

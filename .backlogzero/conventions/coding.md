---
name: coding
description: TypeScript/module conventions for server and client code — read before adding a new file or import
type: convention
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - server/tsconfig.build.json
  - client/tsconfig.json
  - eslint.config.mjs
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/tsconfig.build.json: 2444751fa03d3b2aacbaa88c9a34d1832dc4ed11bc919eeae7d4b8f7aa1fb3be
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- **Server uses `NodeNext` module resolution** (`server/tsconfig.json:4-5`) — relative imports must include the `.js` extension even though the source is `.ts` (e.g. `import { getDb } from '../db.js'` in `server/src/routes/members.ts:2`). This applies to every new server-side file.
- **Client uses `bundler` module resolution** (`client/tsconfig.json:5`) via Vite — same `.js`-extension-on-relative-import style is used for consistency (`client/src/main.tsx:3` imports `'./App.js'`), even though Vite's resolver doesn't strictly require it.
- **`strict: true` in both tsconfigs** — no implicit any, no loose null checks; new code should type-check under `pnpm typecheck` without additional `tsconfig` relaxations.
- **ESLint is flat-config, recommended-only** (`eslint.config.mjs`): `@eslint/js` recommended + `typescript-eslint` recommended, no project-specific custom rules and no `react-hooks`/`react-refresh` plugin configured yet despite the client being React — don't assume React-specific lint rules are enforced.
- **`server/tsconfig.build.json` extends the base tsconfig** and only disables declaration/sourcemap output for the production build (`pnpm build`) — the base `tsconfig.json` (with declarations on) is what `pnpm typecheck` uses.
- Route handlers return `void` and use early `return` after `res.status(...).json(...)` rather than `res.status().json()` chained with an implicit return — follow this style in `server/src/routes/members.ts` for new handlers rather than returning the `Response` object.

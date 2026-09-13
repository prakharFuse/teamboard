---
name: coding-style
description: TS module/import conventions and lint setup — NodeNext extensions, strict mode, flat-config ESLint
type: convention
scope: global
updated: 2026-09-13 (IONE-959)
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

- **Server** compiles with `module`/`moduleResolution: NodeNext`
  (`server/tsconfig.json`) — relative imports must use an explicit `.js`
  extension even though the source is `.ts` (e.g. `import { getDb } from
  '../db.js'` in `server/src/routes/members.ts:2`). This is required by
  NodeNext, not a typo.
- **Client** compiles with `moduleResolution: bundler` (`client/tsconfig.json`)
  and also uses `.js` extensions on relative imports for consistency
  (`client/src/main.tsx:3` imports `./App.js`), even though Vite doesn't
  strictly require it.
- Both configs set `strict: true`; there's no relaxed-strictness escape
  hatch anywhere in the repo — new code should stay fully typed rather than
  reaching for `any` (the existing `as unknown as X` casts in
  `server/src/routes/members.ts` are the established pattern for typing raw
  `node:sqlite` query results, since `DatabaseSync` returns loosely-typed rows).
- ESLint is flat-config (`eslint.config.mjs`) using only
  `@eslint/js` recommended + `typescript-eslint` recommended — no custom
  rules, no Prettier integration configured in this repo.
- `server/tsconfig.build.json` extends the base config only to strip
  declaration/sourcemap output for the `pnpm build` artifact — don't add
  build-only compiler options anywhere else.

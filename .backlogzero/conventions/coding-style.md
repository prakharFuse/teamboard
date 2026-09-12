---
name: coding-style
description: TS module/lint conventions for TeamBoard — server vs client divergence
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

- **Server and client use different module systems — don't copy import
  style across the boundary.** `server/tsconfig.json` uses
  `module`/`moduleResolution: NodeNext`, so server-side relative imports
  must include the `.js` extension (e.g. `import { getDb } from '../db.js'`
  in `members.ts`, resolving to `db.ts`). `client/tsconfig.json` uses
  `ESNext`/`bundler` resolution, so client imports also use `.js` extensions
  for local files (e.g. `main.tsx` imports `'./App.js'` for `App.tsx`) but
  through Vite's bundler resolution rather than Node's ESM loader.
- Both projects have `strict: true`; there is no relaxed-strictness escape
  hatch anywhere in the repo — new code should type-check under strict mode
  as-is.
- Linting is a single flat ESLint config at the repo root
  (`eslint.config.mjs`) covering both `client/` and `server/`, using
  `typescript-eslint`'s `recommended` rule set with no custom rule
  overrides. `dist/`, `node_modules/`, and `data/` are excluded.
- `pnpm typecheck` runs the server and client `tsconfig.json`s separately
  (`tsc --noEmit` twice) — a change that type-checks in one project isn't
  guaranteed to type-check in the other; run the full `pnpm typecheck` before
  considering a change done.

---
name: code-style
description: TypeScript/module conventions and lint setup — read before adding new files or imports
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
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

- **Pure ESM throughout.** Root `package.json` has `"type": "module"`. Server code uses `NodeNext`/`NodeNext` module resolution and imports local files with explicit `.js` extensions (e.g. `import { getDb } from '../db.js'` in `members.ts`, even though the source is `.ts`) — keep that `.js`-suffix convention for any new server-side relative import. Client code uses `moduleResolution: "bundler"` via Vite and follows the same `.js`-suffix habit for local imports (`client/src/main.tsx` imports `./App.js`).
- **`strict: true`** in both `server/tsconfig.json` and `client/tsconfig.json` — no implicit `any`, no unchecked nulls.
- **Lint is flat-config ESLint** (`eslint.config.mjs`) using `@eslint/js` recommended + `typescript-eslint` recommended, with no repo-specific rule overrides and `dist/`, `node_modules/`, `data/` ignored. Don't add a `.eslintrc`; extend `eslint.config.mjs` if a new rule is needed.
- **Two separate tsconfigs for the server**: `server/tsconfig.json` (used by `pnpm typecheck`, emits declarations/sourcemaps) and `server/tsconfig.build.json` (used by `pnpm build`, disables declarations/sourcemaps for the runtime build). If you add compiler options, check whether they belong in the shared base or only the build variant.
- **Explicit return types on exported/route-handler functions** — every handler in `members.ts` and every function in `App.tsx` (`addMember(e): Promise<void>`, `getDb(): DatabaseSync`, etc.) has an explicit return type annotation even where TypeScript could infer it. Match this style for new functions.

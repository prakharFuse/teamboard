---
name: coding-style
description: TypeScript/module conventions for server and client — ESM NodeNext vs bundler, strict mode, ESLint
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

- Whole repo is `"type": "module"` (`package.json:5`) — always use ESM `import`/`export`, never `require`.
- **Server** (`server/tsconfig.json`) uses `module`/`moduleResolution: NodeNext` — relative imports must include the `.js` extension even when importing a `.ts` file (see `import { getDb } from '../db.js'` in `members.ts:2`). This is required by NodeNext resolution, not a typo.
- **Client** (`client/tsconfig.json`) uses `moduleResolution: bundler` via Vite — same `.js`-extension-on-`.ts`-import style is used for consistency (`main.tsx:3` imports `App.js`), though bundler resolution wouldn't strictly require it.
- Both configs have `strict: true` — no implicit `any`, keep it that way for new code.
- Server DB rows are read with `.get()`/`.all()` typed as `unknown` then cast to a local row interface (e.g. `MemberRow` in `members.ts:4-14`) — follow this pattern rather than trusting `node:sqlite`'s loose return types directly.
- Lint via flat config `eslint.config.mjs`: `js.configs.recommended` + `tseslint.configs.recommended`, ignoring `dist/`, `node_modules/`, `data/`. Run with `pnpm lint`.
- No Prettier config in the repo — don't assume a formatter will run in CI; match the existing file's formatting by hand.

---
name: coding
description: TypeScript/module conventions and lint setup — read before adding server or client files
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
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

- Server (`server/tsconfig.json:4-5`) uses `"module": "NodeNext", "moduleResolution": "NodeNext"` — relative imports between server source files must include the `.js` extension (e.g. `from '../db.js'`, `from './routes/members.js'`), even though the files on disk are `.ts`. This trips up editors that autocomplete extension-less imports.
- Client (`client/tsconfig.json:4-5`) uses `"moduleResolution": "bundler"` instead — client-side relative imports also use `.js` in this repo (`client/src/main.tsx:3`, `import App from './App.js'`) for consistency with the server, though bundler resolution wouldn't strictly require it.
- Both configs set `"strict": true`; there's no `tsconfig` in this repo with relaxed strictness — don't add one for new code.
- `pnpm typecheck` (`package.json:14`) runs server and client `tsc --noEmit` as two separate invocations against their own `tsconfig.json`; there's no single project-wide typecheck command.
- Lint is flat-config ESLint (`eslint.config.mjs`) with `@eslint/js` recommended + `typescript-eslint` recommended, and only `dist/`, `node_modules/`, `data/` ignored — it lints both `server/` and `client/` in one `eslint .` pass (`package.json:15`).
- `server/tsconfig.build.json` extends `server/tsconfig.json` and only overrides `declaration`/`declarationMap`/`sourceMap` to `false` — it's the CI/production build config; don't add unrelated compiler option overrides there, keep base options in `server/tsconfig.json`.

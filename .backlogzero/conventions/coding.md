---
name: coding-conventions
description: TypeScript/module conventions specific to TeamBoard's NodeNext + ESM setup
type: convention
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - server/tsconfig.build.json
  - eslint.config.mjs
  - package.json
sources_sha256:
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/tsconfig.build.json: 2444751fa03d3b2aacbaa88c9a34d1832dc4ed11bc919eeae7d4b8f7aa1fb3be
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Server uses `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`
  (`server/tsconfig.json`) with `"type": "module"` in `package.json` —
  relative imports must use explicit `.js` extensions even though the source
  is `.ts` (e.g. `import { getDb } from '../db.js'` in
  `routes/members.ts`). This is required by NodeNext resolution, not a typo.
- `server/tsconfig.build.json` extends `server/tsconfig.json` and only
  strips `declaration`/`declarationMap`/`sourceMap` for the emitted build —
  keep both files in sync if compiler options change.
- ESLint is flat-config (`eslint.config.mjs`) using
  `@eslint/js` recommended + `typescript-eslint` recommended, ignoring
  `dist/`, `node_modules/`, `data/`. There's no custom rule overrides beyond
  that — don't assume stricter rules (e.g. no-explicit-any bans) than what
  `tseslint.configs.recommended` provides.
- `strict: true` is set on the server TS config; route handlers cast raw
  `better-sqlite`/`node:sqlite` query results via `as unknown as MemberRow`
  rather than validating shape at runtime — match this pattern rather than
  introducing a runtime schema validator for a single new field.

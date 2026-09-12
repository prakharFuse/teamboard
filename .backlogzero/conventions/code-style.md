---
name: code-style
description: TypeScript/ESM conventions, lint config, and split tsconfigs for server vs client
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - server/tsconfig.build.json
  - client/tsconfig.json
  - eslint.config.mjs
  - package.json
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/tsconfig.build.json: 2444751fa03d3b2aacbaa88c9a34d1832dc4ed11bc919eeae7d4b8f7aa1fb3be
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- The whole repo is ESM (`"type": "module"` in `package.json`). Server-side relative imports use explicit `.js` extensions even though the source is `.ts` (e.g. `import { getDb } from '../db.js'` in `members.ts`) — this is required by `moduleResolution: "NodeNext"` in `server/tsconfig.json`, not a typo. Keep doing this for any new server import.
- Client (`client/tsconfig.json`) uses `moduleResolution: "bundler"` and does not require the `.js` suffix convention the same way, but `main.tsx` still imports `./App.js` for consistency with the server style — match whichever file you're editing.
- `server/tsconfig.build.json` extends `server/tsconfig.json` and only disables declaration/sourcemap output — it's the config `pnpm build` actually uses. If you need to change compiler options for the build, check both files; changing only `tsconfig.json` won't affect emitted output shape controlled by the build variant.
- Both `strict: true`. Route handlers cast raw `better-sqlite`/`node:sqlite` results with `as unknown as <Row>` (see `members.ts`) rather than validating shape at runtime — there's no runtime schema validator (zod/io-ts/etc.) in the dependency list. Follow the same cast-based pattern for new queries rather than introducing a validation library.
- Lint is `eslint.config.mjs`: flat config, `@eslint/js` recommended + `typescript-eslint` recommended, ignoring `dist/`, `node_modules/`, `data/`. No stricter custom rules layered on top — don't assume rules like `no-explicit-any` beyond typescript-eslint's defaults are enforced.

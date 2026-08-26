---
name: code-style
description: Lint/type-check setup and module conventions — read before adding files or dependencies
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - eslint.config.mjs
  - server/tsconfig.json
  - client/tsconfig.json
  - package.json
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- ESLint flat config (`eslint.config.mjs`): `@eslint/js` recommended +
  `typescript-eslint` recommended, no project-specific rule overrides and no
  React-specific plugin (`eslint-plugin-react`/`react-hooks` are not installed) —
  don't assume hooks-rules lint coverage on `client/src/App.tsx`.
- `pnpm lint` lints the whole repo (`eslint .`), not per-package — a lint error in
  either `client/` or `server/` fails the single `lint` script.
- Server code is strict ESM under `NodeNext` resolution: relative imports must use
  explicit `.js` extensions even though the source is `.ts`
  (e.g. `server/src/index.ts:3` imports `./routes/members.js`). Client code uses
  `bundler` resolution and does not need this (`client/src/main.tsx:3` imports
  `./App.js` by convention but Vite doesn't require the extension).
- Root `package.json` has `"type": "module"` — no CommonJS (`require`/`module.exports`)
  anywhere in `server/` or `client/`.
- Package manager is pnpm (`pnpm-lock.yaml` is the lockfile committed to the repo; CI
  installs with `--frozen-lockfile` in `.github/workflows/ci.yml`) — don't generate or
  commit a `package-lock.json` or `yarn.lock`.

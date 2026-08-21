---
name: coding
description: API error/SQL conventions and lint/type-check strictness for TeamBoard
type: convention
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - eslint.config.mjs
  - server/tsconfig.json
  - client/tsconfig.json
  - server/src/routes/members.ts
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

API error-shape and SQL-parameterization rules are already documented in
`../../CLAUDE.md`'s "Rules" section — follow those.

Two things not covered there:

- **Lint is stock recommended configs, nothing custom.** `eslint.config.mjs`
  is just `js.configs.recommended` + `tseslint.configs.recommended` (not the
  `strict` or `stylistic` tseslint presets) over the whole repo (`dist/`,
  `node_modules/`, `data/` ignored). Don't assume house rules beyond what
  those two presets enforce.
- **Both `tsconfig.json`s set `"strict": true`** (server and client,
  independently — they don't share a base config). Server compiles with
  `module`/`moduleResolution: NodeNext`; client uses `ESNext`/`bundler`. Code
  shared between the two (there currently is none) would need to satisfy both
  resolution modes.

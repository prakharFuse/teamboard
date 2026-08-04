---
name: coding
description: TS/module conventions not spelled out in CLAUDE.md — imports, strictness, lint scope
type: convention
scope: global
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
  - client/src/main.tsx
---

See [../../CLAUDE.md](../../CLAUDE.md) for the API error shape, parameterized-SQL rule, and
`node:sqlite` requirement — those are accurate and don't need repeating here.

## Import extensions

Both `server` (`module: NodeNext`) and `client` (`moduleResolution: bundler`) tsconfigs
require `.js` extensions on relative imports even though the source files are `.ts`/`.tsx` —
e.g. `client/src/main.tsx:3` imports `from './App.js'` for `App.tsx`, and
`server/src/routes/members.ts:2` imports `from '../db.js'` for `db.ts`. Always add the
`.js` suffix on new relative imports, not `.ts`/`.tsx`.

## TypeScript strictness

Both projects have `"strict": true` (`server/tsconfig.json:8`, `client/tsconfig.json:7`) —
avoid `any`; the existing code uses `unknown` + `as unknown as T` casts for `node:sqlite`
query results (e.g. `members.ts:22`) since `DatabaseSync` methods aren't generically typed.

## ESLint scope

`eslint.config.mjs` only applies `@eslint/js` recommended and
`typescript-eslint` recommended rulesets — no project-specific custom rules. `data/`,
`dist/`, and `node_modules/` are ignored. There's no separate React/JSX lint plugin
configured, so `client/src/*.tsx` is linted with the same generic TS rules as the server.

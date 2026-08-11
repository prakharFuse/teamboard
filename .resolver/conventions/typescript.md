---
name: typescript
description: TypeScript module/import conventions on the server (NodeNext) — when .js extensions are required
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/tsconfig.json
  - server/src/index.ts
  - server/src/routes/members.ts
---

`server/tsconfig.json` uses `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` with `strict: true`. Under NodeNext, relative imports of local `.ts` files must use a `.js` extension in the import specifier (matching the compiled output, not the source file) — e.g. `import { getDb } from '../db.js'` in `members.ts:2`, `import membersRouter from './routes/members.js'` in `index.ts:3`. This is required by the module system, not a style choice; omitting the extension breaks compilation. Follow this for any new server-side local import.

The client (`client/tsconfig.json`) is a separate, Vite-bundled project and is not bound by this rule — check its own config before assuming the same extension convention applies there.

Build output for the server goes to `dist/server/` via `server/tsconfig.build.json` (extends `tsconfig.json`, disables declarations/sourcemaps) — `pnpm build` and `pnpm test` both depend on this compiling cleanly first.

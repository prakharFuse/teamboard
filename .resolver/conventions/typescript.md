---
name: typescript
description: Import-path and module conventions required by the server's NodeNext config
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/tsconfig.json
  - server/src/routes/members.ts
---

`server/tsconfig.json` sets `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`. Under
NodeNext, relative imports must use the compiled `.js` extension even though the source files are
`.ts` — e.g. `server/src/routes/members.ts:2` imports `getDb` via `from '../db.js'`, not
`'../db'` or `'../db.ts'`. Any new server file that imports another local server file must follow
this `.js`-suffix pattern or `pnpm build`/`pnpm typecheck` will fail. The client
(`client/tsconfig.json`, `moduleResolution: "bundler"`) has no such requirement — Vite resolves
`.tsx`/`.ts` extensionless imports normally, so this rule is server-only.

Both `server/tsconfig.json` and `client/tsconfig.json` set `"strict": true` — new code in either
package should type-check cleanly under strict mode (no implicit `any`, etc.), matching what's
already there.

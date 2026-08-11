---
name: coding
description: TypeScript/Express conventions specific to this repo — row typing, error shape, module resolution
type: convention
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/tsconfig.json
  - eslint.config.mjs
---

For the error-response shape and parameterized-SQL rule, see [../../CLAUDE.md](../../CLAUDE.md) — accurate as written.

- **Row typing pattern:** define a local `*Row` interface per route file (see `MemberRow` in `members.ts:4-14`) and cast `db.prepare(...).get()/.all()` results through `as unknown as RowType`. `node:sqlite`'s typings return loosely-typed results, so the double cast is the established way to recover a concrete shape — don't reach for `@ts-expect-error` or `any` instead.
- **ESM import extensions:** `tsconfig.json` uses `"module": "NodeNext"`, so relative imports must include the `.js` extension even though the source is `.ts` (e.g. `import { getDb } from '../db.js'` in `members.ts:2`). This isn't a typo — omitting the extension breaks under `NodeNext` resolution.
- **New routes go in `server/src/routes/`** as a `Router` default export, mounted in `server/src/index.ts`. There's currently only one router (`membersRouter`); follow its shape (named `*Row` interface, `const router: Router = Router()`, `export default router`) for consistency.
- **Linting is flat-config, recommended-only** (`eslint.config.mjs`) — `js.configs.recommended` + `tseslint.configs.recommended`, no project-specific rule overrides. Don't add custom lint rules without discussing scope; this repo intentionally keeps the config minimal.

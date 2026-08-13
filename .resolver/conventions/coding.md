---
name: coding
description: Coding conventions for server/client TS — read before writing new routes or validation
type: convention
scope: global
updated: '2026-08-13'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/tsconfig.json
  - eslint.config.mjs
---

For error format, SQL parameterization, and the Node version requirement, see `../../CLAUDE.md` ("Rules" section) — those are accurate and current.

## Patterns observed in the code (not written down elsewhere)

- **Validation is manual truthy checks, not a schema library.** Every handler in `members.ts` validates by hand (`if (!name || !email || ...)`), returning `{ error: string }` with 400. There's no zod/joi/yup in `package.json`. New validation (e.g. department allow-lists) should follow this same inline style for consistency rather than introducing a new dependency.
- **DB errors are caught narrowly by message-matching.** The POST handler catches SQLite errors and checks `err.message.includes('UNIQUE')` to detect duplicate email, then re-throws anything else (`throw err`). Follow this pattern for other constraint violations rather than adding a generic try/catch-and-swallow.
- **Row types are hand-written interfaces cast with `as unknown as`.** `MemberRow` in `members.ts` is manually kept in sync with the `CREATE TABLE` columns in `db.ts` — there's no codegen. If you add a column, update both files.
- **TypeScript is strict** (`server/tsconfig.json` has `"strict": true`) and ESLint uses the flat-config recommended TS rules (`eslint.config.mjs`) with no repo-specific rule overrides — don't add ad-hoc `eslint-disable` comments; fix the type instead.
- **`client/` and `server/` have separate `tsconfig.json`s** and are type-checked independently (`pnpm typecheck` runs both `tsc --noEmit` invocations) — a change in one is not type-checked against the other, so keep any shared shapes (like `Member`) manually in sync between `client/src/App.tsx` and `server/src/routes/members.ts`.

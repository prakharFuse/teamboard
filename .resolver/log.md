2026-08-04 · first-run · created .resolver

- Added knowledge/overview.md — pointer to CLAUDE.md/README.md plus DB-path env override and seed-once gap.
- Added knowledge/architecture.md — client/server/DB flowchart (Vite proxy → Express → SQLite singleton).
- Added knowledge/data-model.md — single-table `members` erDiagram from server/src/db.ts.
- Added knowledge/gotchas.md — TM-105 intentionally-red department-validation test, hard-delete vs. unused `is_active`, unescaped CSV export, PATCH's limited field set.
- Added conventions/testing.md — Node built-in test runner, `:memory:` DB isolation pattern, ephemeral-server-per-test helper.
- Added conventions/coding.md — `.js`-extension import convention, strict TS + `unknown` casts for `node:sqlite`, ESLint's recommended-only rule scope.

2026-08-13 · first-run · created .resolver

- Indexed repo: TeamBoard (Express + SQLite server, React/Vite client), see `../CLAUDE.md` and `../README.md` for the accurate baseline.
- Wrote `knowledge/overview.md`, `knowledge/architecture.md`, `knowledge/data-model.md`, `conventions/coding.md`, `conventions/testing.md`.
- Key derived findings not in existing docs: TM-105 department validation is an open gap with an intentionally RED CI test (`server/src/routes/members.test.ts`); seed data has inconsistent department spellings (`'Eng'` vs `'Engineering'`) in `server/src/db.ts`; DELETE is a hard delete despite the `is_active` soft-delete column.

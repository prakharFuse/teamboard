2026-08-11 · first-run · created .resolver

- Indexed the repo: Express server (`server/src/`), React/Vite client (`client/src/`), single
  `members` SQLite table via `node:sqlite`.
- `CLAUDE.md` and `README.md` are accurate for layout/commands/endpoints — cited by pointer
  rather than restated.
- Found and documented the intentional CI-red state: `server/src/routes/members.test.ts` has a
  department-validation test that fails until TM-105 lands (`knowledge/ci-red-tm-105.md`).
- Found seed-data inconsistency relevant to that fix: `'Engineering'` vs `'Eng'` department
  strings, no canonical department list in code (`knowledge/department-values.md`).
- Added architecture (`knowledge/architecture.md`) and data-model (`knowledge/data-model.md`)
  Mermaid diagrams, plus a testing convention page (`conventions/testing.md`).

2026-08-12 · first-run · created .resolver

- Indexed repo: Express + node:sqlite server, React/Vite client, single `members` table.
- Wrote knowledge pages: overview, architecture (mermaid), data-model (mermaid erDiagram), gotchas.
- Wrote convention page: testing.
- Key finding surfaced across pages: `members.test.ts`'s "rejects an invalid department" test is intentionally RED on main pending TM-105 department validation — not documented in CLAUDE.md/README, flagged in knowledge/overview.md and knowledge/gotchas.md.

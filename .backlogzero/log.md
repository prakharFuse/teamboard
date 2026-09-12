2026-09-12 · first-run · created .backlogzero

- Indexed repo: Express + node:sqlite server, React/Vite client, single `members` table.
- No CLAUDE.md/AGENTS.md/.cursor rules existed to cite or diverge from — README.md was the only user doc, and it was accurate (cited, not copied).
- Captured knowledge pages: overview, architecture (mermaid flowchart), data-model (mermaid erDiagram), gotchas.
- Captured convention pages: coding-style (server/client module divergence), testing (node:test + in-memory DB pattern).
- Key gotcha surfaced: CI is intentionally RED (TM-105 department validation) — documented in members.test.ts and ci.yml, now cross-referenced in gotchas.md so future runs don't try to "fix" it by weakening the test.

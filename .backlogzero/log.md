2026-09-01 · first-run · created .backlogzero

- Indexed repo: single-package TeamBoard app (Express + node:sqlite server, React/Vite client).
- Wrote knowledge pages: overview, architecture (mermaid flowchart), data-model (mermaid erDiagram for `members` table), gotchas.
- Wrote convention pages: testing, code-style.
- Key finding surfaced in gotchas.md: `server/src/routes/members.test.ts` has an intentionally-red test tracking TM-105 (missing department validation) — flagged so it isn't mistaken for a real regression or "fixed" by weakening the test.
- No CLAUDE.md/AGENTS.md found in the repo; README.md is accurate for stack/scripts/API and was cited rather than duplicated.

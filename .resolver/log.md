2026-08-26 · first-run · created .resolver

- Indexed TeamBoard (Express/SQLite server + React/Vite client, no CLAUDE.md/AGENTS.md/.cursor rules present).
- Wrote knowledge/overview.md, architecture.md, data-model.md, gotchas.md and conventions/testing.md, coding.md.
- Notable finding: server/src/routes/members.test.ts has an intentionally-red test (TM-105, department validation) wired into .github/workflows/ci.yml — captured in knowledge/gotchas.md.

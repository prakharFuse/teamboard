# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real request flow between the Vite client, Express API, and the SQLite file — read before touching cross-cutting behavior
- `knowledge/data-model.md` · global · The members table schema (single-table SQLite DB) — column meanings and what's NOT enforced
- `knowledge/gotchas.md` · global · Non-obvious runtime traps in TeamBoard's server — DB singleton timing, hard-delete, unescaped CSV
- `knowledge/overview.md` · global · What TeamBoard is, where things live, and the in-flight ticket (TM-105) that shapes current CI state

## conventions

- `conventions/api-conventions.md` · server/** · Route-handler conventions in server/src/routes — error shape, lookups, SQL param style — and the validation gap new routes should close, not repeat
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How server tests are structured — Node's built-in test runner, in-memory DB, and the intentional-red-test pattern for open tickets

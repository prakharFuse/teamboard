# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real component shape and request flow — client, Express server, SQLite file
- `knowledge/data-model.md` · global · The members table schema — single-table SQLite schema defined inline in db.ts
- `knowledge/gotchas.md` · global · Sharp edges in member CRUD, CSV export, and the singleton DB that aren't documented elsewhere
- `knowledge/overview.md` · global · Where to start — TeamBoard is a small single-repo Express+SQLite API with a React client, no workspaces

## conventions

- `conventions/api-style.md` · server/src/routes/** · HTTP status/error conventions in members.ts beyond what CLAUDE.md's Rules section states
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How server tests are structured — Node's built-in test runner, in-memory SQLite, per-call ephemeral HTTP server

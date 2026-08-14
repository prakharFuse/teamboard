# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, API, and database actually connect — request flow diagram
- `knowledge/data-model.md` · global · The members table schema — columns, defaults, and what's not enforced
- `knowledge/gotchas.md` · global · Known-broken or intentionally-red behavior — read before touching members API validation or export
- `knowledge/overview.md` · global · What TeamBoard is and where to find the canonical docs — read this first

## conventions

- `conventions/api-conventions.md` · server/src/routes/** · Members route handler patterns not already stated in CLAUDE.md — field allowlists, error handling
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How server tests are structured — Node test runner, in-memory DB, ephemeral HTTP server

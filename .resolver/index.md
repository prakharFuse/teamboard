# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real system shape — client/server/db wiring and how requests flow through TeamBoard
- `knowledge/data-model.md` · global · The members table schema — single-table SQLite schema, read before touching db.ts or members.ts
- `knowledge/gotchas.md` · global · Non-obvious gaps and traps in the members API found by reading the code — check before editing routes or CI
- `knowledge/overview.md` · global · Entry point for the .resolver overlay — start here, then follow links for architecture, data model, and gotchas

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How TeamBoard server tests are structured — read before adding or editing server/src/routes/*.test.ts

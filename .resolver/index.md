# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and database actually talk to each other
- `knowledge/data-model.md` · global · Schema of the single `members` SQLite table (read before changing db.ts or members.ts)
- `knowledge/gotchas.md` · global · Non-obvious runtime and CI behaviors in the members API — read before touching routes, CI, or the dev workflow

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How server tests are structured — in-memory DB, per-test ephemeral HTTP server, no mocking framework

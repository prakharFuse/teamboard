# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real runtime shape of TeamBoard — client, server, and DB, and how they talk
- `knowledge/data-model.md` · global · TeamBoard's SQLite schema — a single members table, defined in code (no migration files)
- `knowledge/gotchas.md` · global · Non-obvious behavior in TeamBoard that looks like a bug but is either intentional or a known gap — read before "fixing" any of it
- `knowledge/overview.md` · global · What TeamBoard is and where things live — read first for orientation

## conventions

- `conventions/api-patterns.md` · server/src/routes/** · Route-handler idioms used across server/src/routes/members.ts — follow these when adding endpoints
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How TeamBoard's server tests are written and run — no framework, in-memory DB, in-process server

# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Runtime shape of TeamBoard — client, server, DB, and how they connect
- `knowledge/data-model.md` · global · The members table schema — the only table in TeamBoard's SQLite DB
- `knowledge/gotchas.md` · global · Known sharp edges and an intentionally-failing test in TeamBoard — read before touching members.ts
- `knowledge/overview.md` · global · What TeamBoard is and where to find the canonical project docs

## conventions

- `conventions/coding-style.md` · global · API error shape, SQL, and lint/type rules for TeamBoard — supplements CLAUDE.md's Rules section
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How TeamBoard's server tests are structured — no framework, in-memory DB, ephemeral HTTP server per test

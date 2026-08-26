# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real request-flow shape of TeamBoard — client, server, and the SQLite file
- `knowledge/data-model.md` · global · The single `members` table schema, defined inline in db.ts (no migration tool)
- `knowledge/gotchas.md` · global · Known sharp edges — the intentionally-red CI test, CSV export, and validation gaps
- `knowledge/overview.md` · global · What TeamBoard is, its stack, and where things live — read first for orientation

## conventions

- `conventions/coding.md` · global · TypeScript/route conventions for TeamBoard's server and client
- `conventions/testing.md` · server/** · How TeamBoard's server tests are structured — node:test, no framework, ephemeral HTTP server per test file

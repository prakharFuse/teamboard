# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real request flow between the Vite client, Express API, and SQLite — read before touching routing or the dev proxy
- `knowledge/data-model.md` · global · The single members table schema, read before adding columns or migrations
- `knowledge/gotchas.md` · global · Code-verified behavior that surprises people coming from the README/CLAUDE.md endpoint list — read before changing members.ts
- `knowledge/overview.md` · global · What TeamBoard is and where to find the canonical layout/commands docs

## conventions

- `conventions/coding.md` · global · TypeScript/Express conventions specific to this repo — row typing, error shape, module resolution
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How server tests are structured — Node's built-in test runner, in-memory SQLite, real HTTP calls per test

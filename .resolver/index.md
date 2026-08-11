# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real component shape and request path for TeamBoard (client, server, DB) — read before touching routing, proxy, or build/start scripts
- `knowledge/data-model.md` · global · members table schema, seed data quirks, and the is_active soft-delete gap — read before writing migrations or department validation
- `knowledge/gotchas.md` · server/src/routes/** · Known-broken or intentionally-red behaviors in members.ts (missing department validation, CSV escaping) — read before editing the members API

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How TeamBoard's server tests are structured (ephemeral in-process server, in-memory SQLite, compiled-output execution) — follow this pattern for new route tests

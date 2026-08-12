# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and SQLite file actually talk — read before touching routing, proxy, or db.ts
- `knowledge/data-model.md` · global · The members table schema and the is_active column's actual (non-)role — read before adding delete/archive behavior
- `knowledge/gotchas.md` · server/src/routes/** · Route-order and CSV-export traps in members.ts that are easy to break silently
- `knowledge/overview.md` · global · Read first — what TeamBoard is, and the one open ticket (TM-105) that shapes the codebase right now

## conventions

- `conventions/api-style.md` · server/src/routes/** · Extra route-handler conventions not in CLAUDE.md — static-path-before-:id ordering and PATCH's field allowlist
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/**/*.test.ts · How server tests are structured (no framework, in-memory SQLite, ephemeral listen server) and the TM-105 red test rule

# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real component shape of TeamBoard (client, server, DB) and how they talk — read before touching app wiring
- `knowledge/data-model.md` · global · TeamBoard SQLite schema (single members table) — read before adding fields or queries
- `knowledge/overview.md` · global · TeamBoard project map and gaps not covered by CLAUDE.md/README — read first for orientation

## conventions

- `conventions/api.md` · server/** · TeamBoard API conventions (error shape, SQL) and what's not yet enforced — read before adding/changing routes
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · TeamBoard test conventions — read before touching server/src/routes/members.test.ts or CI

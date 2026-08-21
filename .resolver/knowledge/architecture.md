---
name: architecture
description: Real component shape of TeamBoard (client, server, DB) and how they talk
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 723fa66f9637d236acd5978440466789d18b0101
sources:
  - server/src/config.ts
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
sources_sha256:
  client/vite.config.ts: 161f50bdb33c686ffa9de457ad3911f96ea0c67ca9e80362b6691df838b4593a
  server/src/config.ts: 134913d7745e8144ee89b2f751247450742b24d7710f42a43ae4420c99b30c68
  server/src/db.ts: f202876296b6d7722a69d08416fe1c9f2a18ce4a3d06dc2ce60299a0d48ef340
  server/src/index.ts: 8bf1866cdb94244360f9786673869c67dedf3b93aa2c05dbe8aa6b908cb871b5
---

- `server/src/config.ts` is the single source of typed runtime config (port,
  host, dbPath, csvFilename), exposed as lazy `get` accessors so env-var
  overrides applied after import still take effect; `index.ts`, `db.ts`, and
  `members.ts` all import it. `client/vite.config.ts` can't import this TS
  module (it runs standalone under Vite/Node), so it duplicates the same
  port-resolution logic by hand — keep both in sync when changing the
  `TEAMBOARD_*` env var scheme.

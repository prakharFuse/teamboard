---
name: overview
description: What TeamBoard is and where to look first — see CLAUDE.md/README.md for the basics
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 723fa66f9637d236acd5978440466789d18b0101
sources:
  - server/src/config.ts
  - client/vite.config.ts
  - server/src/index.ts
  - README.md
sources_sha256:
  README.md: 3f357c726ad06bb26d98e9b3405a1570a7d022638782ccf771cee3558e05a08c
  client/vite.config.ts: 161f50bdb33c686ffa9de457ad3911f96ea0c67ca9e80362b6691df838b4593a
  server/src/config.ts: 134913d7745e8144ee89b2f751247450742b24d7710f42a43ae4420c99b30c68
  server/src/index.ts: 8bf1866cdb94244360f9786673869c67dedf3b93aa2c05dbe8aa6b908cb871b5
---

Project layout, commands, endpoints, and API error/SQL conventions are already
documented in `../../CLAUDE.md` and `../../README.md` — read those first.

Facts not covered there:

- `pnpm dev` runs `node --watch dist/server/index.js` (see `package.json`
  `dev:server`) — it watches the **compiled** output, not `server/src`. Editing
  TypeScript source and expecting the dev server to pick it up does nothing;
  you must re-run `pnpm build` (or run it in a separate watch loop) to see
  server changes while `pnpm dev` is running.
- Ports are no longer hardcoded: `server/src/config.ts` resolves the server
  port from `TEAMBOARD_PORT` (falling back to the legacy `PORT` var, then
  `4060`), and `client/vite.config.ts` mirrors that same resolution
  (`TEAMBOARD_API_TARGET` / `TEAMBOARD_PORT` / `PORT` / `4060`) to build its
  dev proxy target, since it can't import the server's TS config module
  directly. See README.md "Configuration" for the full table of overridable
  values.
- See [[architecture]] for how the pieces connect, [[data-model]] for the
  schema, and [[gotchas]] for known sharp edges before touching `members.ts`.

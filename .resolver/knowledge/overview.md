---
name: overview
description: What TeamBoard is and where to look first — see CLAUDE.md/README.md for the basics
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - server/src/db.ts
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

Project layout, commands, endpoints, and API error/SQL conventions are already
documented in `../../CLAUDE.md` and `../../README.md` — read those first.

Facts not covered there:

- `pnpm dev` runs `node --watch dist/server/index.js` (see `package.json`
  `dev:server`) — it watches the **compiled** output, not `server/src`. Editing
  TypeScript source and expecting the dev server to pick it up does nothing;
  you must re-run `pnpm build` (or run it in a separate watch loop) to see
  server changes while `pnpm dev` is running.
- The client dev server proxies `/api` to `http://localhost:4060`
  (`client/vite.config.ts`), so client and server ports are hardcoded and must
  match `PORT` in `server/src/index.ts` (default 4060).
- See [[architecture]] for how the pieces connect, [[data-model]] for the
  schema, and [[gotchas]] for known sharp edges before touching `members.ts`.

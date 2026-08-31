---
name: overview
description: Read first — what TeamBoard is, where to find tech stack/scripts/API docs, and structural facts the README omits
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - client/vite.config.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

Tech stack, setup commands, the API endpoint table, and the on-disk layout are already documented accurately in [README.md](../../README.md) — read that first.

## Facts the README doesn't state

- **Single package, not a monorepo.** There is no `pnpm-workspace.yaml` and `package.json` has no `workspaces` field. `client/` and `server/` are two source trees under one root `package.json`, each with its own `tsconfig.json`. Don't assume per-package installs or independent versioning.
- **The server never serves the client build.** `server/src/index.ts` mounts only `/api/members` on Express — there's no `express.static` anywhere in the repo. `pnpm dev` works because Vite's dev server proxies `/api` to port 4060 (see `client/vite.config.ts`), but `pnpm build` / `pnpm start` only compiles and runs the server; there is no production path that serves the built client. If asked to "deploy" or "run the built app end-to-end," this gap needs to be filled first.
- **`pnpm test` runs against compiled output, not TypeScript directly** — the `test` script is `pnpm build && node --test "dist/server/**/*.test.js"`. Editing a `.test.ts` file has no effect until a rebuild.

See [[gotchas]] for known functional gaps and [[architecture]] for the request flow.

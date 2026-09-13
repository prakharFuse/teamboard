---
name: overview
description: What TeamBoard is, tech stack, and where to find getting-started info
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team-directory app (member profiles, departments, HR
export). Tech stack, getting-started commands, the API table, and project
layout are already documented accurately in [README.md](../../README.md) —
see that file rather than duplicating it here.

Node >= 22.5 is required specifically because the server uses the built-in
`node:sqlite` module (`server/src/db.ts`) — there is no external SQLite
dependency in `package.json`.

Testing uses Node's built-in `node:test` runner, not Jest/Vitest/Mocha —
there is no test framework in `devDependencies`. See
[[testing-conventions]] for the implications of that.

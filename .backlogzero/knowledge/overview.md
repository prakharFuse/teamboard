---
name: overview
description: What TeamBoard is, its purpose, and tech stack — read first for orientation
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
---

TeamBoard is an internal team directory (member profiles, departments, HR
reporting). Purpose, tech stack, getting-started steps, and the API table are
accurately described in [README.md](../../README.md) — see that file rather
than duplicating it here.

## Derived facts not in the README

- The server is a single Express router (`server/src/routes/members.ts`)
  mounted at `/api/members` in `server/src/index.ts`; there is no other
  route module.
- `node:sqlite` (`DatabaseSync`) is used directly with no ORM/query builder —
  all queries in `members.ts` are hand-written parameterized SQL strings.
- The client has no router and no state management library — `App.tsx` is a
  single component holding all state via `useState`/`useEffect`, calling the
  API with plain `fetch`.
- Server and client are two separate TypeScript projects with different
  module targets — see [[coding-style]] for the divergence between them.

For the real request-flow shape, see [[architecture]]. For the schema, see
[[data-model]]. For non-obvious behavior, see [[gotchas]].

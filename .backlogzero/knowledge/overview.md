---
name: overview
description: What TeamBoard is, tech stack, and how to read the rest of the overlay — start here
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
  - server/src/routes/members.ts
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

TeamBoard is an internal team directory (members, departments, HR CSV export). Tech stack, project layout, and the API route table are accurately described in `../../README.md` — read that first; this page only adds what it omits.

## What the README doesn't say

- **Routing order matters and is already correct.** `server/src/routes/members.ts` defines `/export` and `/stats` before the generic `/:id` route. If `/:id` were registered first, `GET /api/members/export` would be swallowed by the id handler (`Number('export')` → `NaN` → 404). Keep any new static sub-paths above `/:id`.
- **`GET /api/members/export` exports ALL rows, not just active ones** (`server/src/routes/members.ts:50`), unlike `GET /api/members` which filters `WHERE is_active = 1`. The README's API table doesn't distinguish this — HR's CSV intentionally includes inactive/removed members while the main UI list doesn't.
- **`node:sqlite` is used directly (no ORM)** via `server/src/db.ts`. All queries are hand-written SQL with `?` placeholders — keep using parameterized queries for any new query, never string-interpolate user input.
- See `[[gotchas]]` for the hard-delete-vs-`is_active` divergence and the known intentionally-red CI test.
- See `[[architecture]]` for the request flow and `[[data-model]]` for the schema.
- See `[[testing]]` for how the one existing test file is structured and run.

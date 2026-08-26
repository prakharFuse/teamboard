---
name: gotchas
description: API-level rough edges in the members routes not covered by the schema page — read before touching members.ts
type: knowledge
scope:
  - server/src/routes/members.ts
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - README.md
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- `GET /api/members/export` builds CSV by naive string interpolation with no quoting
  or comma/newline escaping (`server/src/routes/members.ts:52-54`). Any member whose
  `name`, `email`, `role`, or `department` contains a comma (e.g. "Smith, Jane") will
  produce a malformed row in the HR-facing CSV download.
- `PATCH /api/members/:id` only accepts `name`, `email`, `role`, `department`
  (`members.ts:92`) — `start_date` cannot be corrected once a member is created, even
  though it's a required field on `POST` (`members.ts:28`). The README's API table
  (`../../README.md`) describes PATCH generically as "Update member fields"; in
  practice `start_date` and `is_active` are excluded.
- Route order matters: `GET /:id`, `PATCH /:id`, `DELETE /:id` are declared after
  `GET /export` and `GET /stats` (`members.ts:48,60,71`). If a new `GET /:something`
  route is ever added before `/export` or `/stats`, Express will match the numeric-id
  route first and shadow it — keep any new static sub-routes above the `/:id` routes.

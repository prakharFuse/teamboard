---
name: api-style
description: Extra route-handler conventions not in CLAUDE.md — static-path-before-:id ordering and PATCH's field allowlist
type: convention
scope:
  - server/src/routes/**
updated: 2026-08-12 (IONE-959)
captured_sha: 1200413d009895f880bb480e9b74194c0f6b3934
sources:
  - server/src/routes/members.ts
---

- **Department is an allowlist, not free text.** `VALID_DEPARTMENTS`
  (`members.ts:16`) is the single source of truth checked by both
  `POST /` and `PATCH /:id` — currently `['Engineering', 'Product', 'Design',
  'Eng', 'Marketing', 'Sales', 'Human Resources']` (note both `'Engineering'`
  and `'Eng'` are valid, separately). An unknown value gets `400
  { "error": "Invalid department: ... " }`. To add a new department, extend
  this one array — both routes pick it up automatically.

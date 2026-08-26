---
name: testing
description: How TeamBoard's server tests are structured — no framework, in-memory DB, and the intentional RED test
type: convention
scope:
  - server/**
updated: 2026-08-26 (IONE-959)
captured_sha: feebfb6d48ce5584a4e5e74853fd1807ca499b57
sources:
  - server/src/slack.test.ts
sources_sha256:
  server/src/slack.test.ts: db56cdbc9a43bc52167e4891f4b3a35ebff3d188a80f023f1749403b5881a55b
---

Modules with no DB/HTTP dependency (e.g. `server/src/slack.ts`) are unit-tested by stubbing `globalThis.fetch` directly and restoring it (plus `process.env.SLACK_WEBHOOK_URL`) in a `finally` block — see `slack.test.ts`. This is separate from the `app.listen(0)`/`makeApp()` pattern used for route tests; use whichever fits the module under test.

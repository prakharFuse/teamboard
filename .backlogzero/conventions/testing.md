---
name: testing
description: How TeamBoard's tests are written and run — node:test, no framework, in-memory DB
type: convention
scope:
  - server/**
updated: 2026-09-16 (IONE-959)
captured_sha: 90b4e52c842667da0da95f034cf73a2c51089aee
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/routes/members.test.ts: 515b7b622a686614246e97acd832413e4c01cc4a75c774418b35aff28ca4277c
  server/src/routes/members.ts: 9ce9d96e34012c4b3799983e87e08ca6b5b0b5429ff1ddad2bdb9d0de75a9fb5
---

- Handlers that call out to external systems are exported as a mutable object with a method (e.g. `export const ssoDeprovision = { dispatch(...) {...} }` in `members.ts`), not a plain function, specifically so tests can spy/stub via `mock.method(ssoDeprovision, 'dispatch', fn)` from `node:test` and assert call count/arguments (`members.test.ts`) without hitting the real external system.

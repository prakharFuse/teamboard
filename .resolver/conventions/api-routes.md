---
name: api-routes
description: Handler-writing conventions in server/src/routes — error shapes, partial updates, uniqueness handling
type: convention
scope:
  - server/src/routes/**
updated: 2026-08-26 (IONE-959)
captured_sha: feebfb6d48ce5584a4e5e74853fd1807ca499b57
sources:
  - server/src/routes/members.ts
  - server/src/slack.ts
sources_sha256:
  server/src/routes/members.ts: dff4bbd5a915fd18f1a81a8bbda196797ec01112fc7dc33b111c3f66a82fa35f
  server/src/slack.ts: 4f77d9556ce2dca3cb42ef9fb357b366bd4ddc8be59e8cfa9be98af09245c843
---

Non-uniqueness errors in `POST /api/members` fire a Slack notification via `void notifyFailure({ operation, error })` (`server/src/slack.ts`) immediately before `throw err;` (`members.ts:45-46`) — the call is fire-and-forget (not awaited) and never swallows or replaces the original error being rethrown. Follow this call-then-rethrow, don't-await pattern if wiring `notifyFailure` into other routes.

---
name: gotchas
description: Known-red CI test, an unhandled-error path that breaks the documented error contract, and seed-data quirks
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: dbb16a8c78b2e567d18fe830557db3891b5ed4c9
sources:
  - server/src/slack.ts
  - server/src/slack.test.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - README.md
sources_sha256:
  README.md: f98f747160936905454a1521a388a51b1f9923379fed934bb1c91abd326162d5
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/src/slack.test.ts: a8afe6cadae0b9b726c56217f608876790a71fdf5934e70dbb9ee59279027c84
  server/src/slack.ts: 05221b24a337ee348a941ce2cbe45ed08b32f338fd3583959e73809747fbd5d2
diverges_from:
  - source: README.md#Slack-notifications
    claim: The server can report failed operations to a Slack channel via an incoming webhook.
    reality: notifyFailure/postToSlack are implemented in server/src/slack.ts but are never invoked from any route or error handler; only the test file calls them.
    authority: code
    detected: '2026-08-21'
    run: b7a51f9e-52fc-4c8f-abe6-d072fa06e136
---

## Slack failure notifications exist but nothing calls them

`server/src/slack.ts` exports `notifyFailure`/`postToSlack` (gated on
`SLACK_WEBHOOK_URL`) and README documents them under "Slack notifications" as
if the server reports failed operations to Slack. In reality no route or
handler imports `slack.js` — `server/src/index.ts` and
`server/src/routes/members.ts` never call `notifyFailure`. The only caller is
`server/src/slack.test.ts`. The module is fully implemented and tested but
not wired into any actual failure path yet.

2026-08-21 · first-run · created .resolver
b7a51f9e-52fc-4c8f-abe6-d072fa06e136: gotchas.md +fact — Slack notification module (server/src/slack.ts) is implemented/tested but not called from any route, contradicting README's Slack notifications section
2026-08-21 · b7a51f9e-52fc-4c8f-abe6-d072fa06e136 · corrected knowledge/gotchas.md — README.md#Slack-notifications is stale (notifyFailure/postToSlack are implemented in server/src/slack.ts but are never invoked from any route or error handler; only the test file calls them.)

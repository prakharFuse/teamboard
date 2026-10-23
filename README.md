# Teambaord

A small task-tracking service used as the journey suite's fixture repository.

> The heading above is misspelled ON PURPOSE. The `tiers.easy` fixture issue
> (`helpers/journey-issues.ts`) asks an agent to correct "Teambaord" →
> "Teamboard", so this typo is the fixture's subject. If you fix it by hand the
> easy-tier journey has nothing to do and its plan becomes vacuous. Leave it.

## What this is

Fixture content, not a product. It exists so the journeys that resolve a real
Jira ticket have a real repository to plan against, clone, branch and open a
pull request on. It is deliberately small but not empty: several fixtures ask an
agent to *audit* the code (centralise hardcoded config) or *extend* it (add a
Slack notifier, add a `--quiet` flag), and an empty repo makes those tickets
unanswerable — the assessment still succeeds and the plan says nothing.

Re-seeded by `pnpm test:journey provision-repo` (and automatically by the
`provision` setup project). Content is reconciled against
`tests/journeys/seed/journey-repo/`, so edit the pack, never the remote.

## Usage

```bash
npm install
npm start -- --help
```

## Configuration

Environment variables are read in `src/config.ts`. See that file for the
current list.

### Slack notifications

`TEAMBOARD_SLACK_WEBHOOK_URL` is read by `src/slack-notifier.js`, not
`config.ts`. When it is unset or blank, notifications are a silent no-op.

To create a Slack incoming webhook:

1. Open <https://api.slack.com/apps> and create an app (**From scratch**).
2. Enable **Incoming Webhooks**.
3. Click **Add New Webhook to Workspace** and pick a channel.
4. Copy the webhook URL, which looks like
   `https://hooks.slack.com/services/<WORKSPACE_ID>/<CHANNEL_ID>/<SECRET>`.

The URL is a credential: export it in your shell or deployment environment
and never commit it.

```bash
export TEAMBOARD_SLACK_WEBHOOK_URL='https://hooks.slack.com/services/<...>'
```

Usage:

```js
import { notifyFailure } from './src/slack-notifier.js';

await notifyFailure({ operation: 'tasks', error, details: { attempt: 3 } });
```

`notifyFailure` returns `true` when the message was posted and `false` when
the webhook is unconfigured or Slack rejects the message (logged as a
warning). It never throws.

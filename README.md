# TeamBoard

Internal team directory for managing team member profiles, departments, and HR reporting.

## Tech stack

- **Server:** Node.js, Express, TypeScript, SQLite (`node:sqlite`)
- **Client:** React, TypeScript, Vite
- **Runtime:** Node.js >= 22.5 (required for `node:sqlite`)

## Getting started

```bash
pnpm install
pnpm build
pnpm dev
```

Server runs on port 4060, client on port 5173 with API proxy to the server.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/members | List active team members |
| POST | /api/members | Add a team member |
| GET | /api/members/:id | Get member by ID |
| PATCH | /api/members/:id | Update member fields |
| DELETE | /api/members/:id | Remove a team member |
| GET | /api/members/export | Download CSV (HR integration) |
| GET | /api/members/stats | Department statistics |

## Slack notifications

Failed operations (e.g. an error while adding a team member) can be reported to a Slack channel via an [Incoming Webhook](https://api.slack.com/messaging/webhooks).

### Environment variable

| Variable | Description |
|----------|-------------|
| `SLACK_WEBHOOK_URL` | The Slack Incoming Webhook URL to POST failure notifications to. If unset, notifications are silently skipped (see below). |

### Creating a Slack Incoming Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app (or select an existing one).
2. Under **Features**, open **Incoming Webhooks** and toggle it **On**.
3. Click **Add New Webhook to Workspace**, choose the channel that should receive notifications, and authorize it.
4. Copy the generated webhook URL — it looks like `https://hooks.slack.com/services/T000/B000/XXXXXXXXXXXXXXXXXXXXXXXX`.
5. Set it as the `SLACK_WEBHOOK_URL` environment variable wherever the server runs (e.g. in a local `.env` file or your deployment's secret store).

> **Warning:** The webhook URL is a secret — anyone with it can post messages to your Slack channel. Never commit it to source control or share it outside your team's secret management tooling.

### Silent-skip behavior

`notifyFailure()` (in `server/src/slack.ts`) checks `SLACK_WEBHOOK_URL` at call time. If the variable is not set, it logs a warning and returns without making any network request — failure notifications are opt-in and the app functions normally without Slack configured.

## Project structure

```
teamboard/
├── server/src/
│   ├── index.ts           — Express app
│   ├── db.ts              — SQLite init + seed data
│   ├── slack.ts           — Slack failure notifications
│   └── routes/
│       └── members.ts     — Member CRUD + export
├── client/src/
│   ├── App.tsx            — Main UI
│   ├── main.tsx           — Entry point
│   └── styles.css         — Styles
└── data/                  — SQLite database (gitignored)
```

## Database

SQLite file at `data/team.db`, auto-created on first run with sample data (8 team members across departments).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run server + client concurrently |
| `pnpm build` | Compile server TypeScript |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm start` | Run compiled server only |

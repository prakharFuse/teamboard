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

## Project structure

```
teamboard/
├── server/src/
│   ├── index.ts           — Express app
│   ├── db.ts              — SQLite init + seed data
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

## Slack notifications

The server can report failed operations to a Slack channel via an incoming webhook.

| Variable | Required | Description |
|----------|----------|--------------|
| `SLACK_WEBHOOK_URL` | No | Slack incoming-webhook URL used to post failure notifications. If unset, notifications are skipped (logged as a warning) and the app continues to run normally — no other functionality depends on it. |

`SLACK_WEBHOOK_URL` is a secret credential — anyone with the URL can post to your Slack channel. Keep it out of source control and shell history:

- Set it as a local environment variable or in an untracked `.env` file (never commit it).
- In CI/production, set it via your platform's secrets manager (e.g. GitHub Actions secrets, your host's environment variable settings).
- The server never logs the webhook URL itself, only response status codes.

### Creating a Slack incoming webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** (choose "From scratch"), or select an existing app.
2. In the app settings, open **Incoming Webhooks** and toggle it **On**.
3. Click **Add New Webhook to Workspace**.
4. Choose the channel that should receive failure notifications and click **Allow**.
5. Copy the generated webhook URL (it looks like `https://hooks.slack.com/services/T000/B000/XXXXXXXX`).
6. Set it as the `SLACK_WEBHOOK_URL` environment variable for the server, e.g.:

   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T000/B000/XXXXXXXX"
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run server + client concurrently |
| `pnpm build` | Compile server TypeScript |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm start` | Run compiled server only |

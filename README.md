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

## Configuration

All tunable values live in `server/src/config.ts`, a single typed source of truth. Every value has a compile-time default and can be overridden at runtime via a `TEAMBOARD_*` environment variable, without a code change.

| Config field | Env var override | Default | Notes |
|--------------|-------------------|---------|-------|
| `port` | `TEAMBOARD_PORT` | `4060` | Falls back to the legacy bare `PORT` var (common on hosting platforms) before defaulting |
| `host` | `TEAMBOARD_HOST` | `localhost` | |
| `dbPath` | `TEAMBOARD_DB_PATH` | `<cwd>/data/team.db` | Name kept as-is (no `TEAMBOARD_` prefix change) since tests already depend on it |
| `csvFilename` | `TEAMBOARD_CSV_FILENAME` | `members.csv` | Used for the `/api/members/export` `Content-Disposition` filename |

The client's Vite dev proxy (`client/vite.config.ts`) mirrors the server's port resolution (`TEAMBOARD_API_TARGET` / `TEAMBOARD_PORT` / legacy `PORT`, defaulting to `4060`) since it can't import the server's TypeScript module directly.

### Adding a new config value

1. Add the field to the `Config` interface in `server/src/config.ts`.
2. Add a `get` accessor on the exported `config` object that reads it via the `envString`/`envNumber` helpers with a sensible default.
3. Reference `config.<field>` wherever the hardcoded value used to live.

### Overriding at runtime

Set the corresponding env var before starting the process, e.g.:

```bash
TEAMBOARD_PORT=8080 TEAMBOARD_HOST=0.0.0.0 pnpm start
```

### Type-system contract

`config` is typed against the `Config` interface, so every field is a known, readonly, correctly-typed value (`number` or `string`) — consumers get compile-time checking and autocomplete instead of untyped `process.env` access scattered through the codebase. Values are read lazily via `get` accessors (evaluated on each property access, not cached at import time), so tests can mutate `process.env` after importing the module and still observe the override.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run server + client concurrently |
| `pnpm build` | Compile server TypeScript |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm start` | Run compiled server only |

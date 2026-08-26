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

## Configuration

All runtime configuration is centralised in `server/src/config.ts`. It exposes compile-time
`defaults`, a `Config` interface, and a `loadConfig(env)` function that layers `TEAMBOARD_*`
environment variable overrides on top of those defaults. An eager `config` singleton (built from
`process.env`) is what the rest of the server imports.

| Config field | Env var | Default |
|--------------|---------|---------|
| `port` | `TEAMBOARD_PORT` (falls back to legacy `PORT`) | `4060` |
| `host` | `TEAMBOARD_HOST` | `localhost` |
| `dbPath` | `TEAMBOARD_DB_PATH` | `<cwd>/data/team.db` |
| `csvFileName` | `TEAMBOARD_CSV_FILENAME` | `members.csv` |

`client/vite.config.ts` reads the same `TEAMBOARD_HOST` / `TEAMBOARD_PORT` (or `PORT`) variables
to build its `/api` proxy target, so the client and server agree on where the API lives without
duplicating the defaults.

### Adding a new config value

1. Add the field to the `defaults` object and the `Config` interface in `server/src/config.ts`.
2. Read its override in `loadConfig`, following the `TEAMBOARD_<FIELD_NAME>` naming scheme (one
   env var per field, upper-snake-cased).
3. Consume the new field via the `config` singleton (`import { config } from './config.js'`)
   instead of reading `process.env` directly anywhere else.

### Overriding at runtime

Set the relevant `TEAMBOARD_*` environment variable before starting the server, e.g.:

```bash
TEAMBOARD_PORT=8080 TEAMBOARD_HOST=0.0.0.0 pnpm start
```

Unset variables fall back to the compiled-in `defaults`; invalid values (e.g. a non-numeric or
non-positive `TEAMBOARD_PORT`) also fall back to the default rather than crashing the server.

### How the type system enforces the contract

`loadConfig` returns `Config`, so every field is required and typed — a config module that
forgets to populate a field, or assigns it the wrong type, fails to compile. Consumers importing
`config` get the same static guarantees, so a typo like `config.prot` is a compile error rather
than a silent `undefined` at runtime.

### CSV format constants stay inline

The `text/csv` content type and the CSV header row in `server/src/routes/members.ts` are part of
the CSV format itself, not deployment configuration, so they remain inline constants rather than
moving into `config.ts`. Only the exported filename (`csvFileName`) is configurable.

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

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run server + client concurrently |
| `pnpm build` | Compile server TypeScript |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm start` | Run compiled server only |

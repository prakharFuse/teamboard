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

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run server + client concurrently |
| `pnpm build` | Compile server TypeScript |
| `pnpm typecheck` | Type-check both server and client |
| `pnpm start` | Run compiled server only |

## Contributing

Please open an issue before submitting a pull request.

## Support

For help, open a GitHub issue. (doc update 2026-06-11T13:51:24.256Z)


# CLAUDE.md

## Project
TeamBoard — internal team directory. Express + React + SQLite.

## Layout
- `server/src/` — Express API (TypeScript, compiled to `dist/`)
- `client/src/` — React UI (Vite)
- `data/` — SQLite database (gitignored)

## Commands
- `pnpm install` — install dependencies
- `pnpm dev` — run server + client concurrently
- `pnpm build` — compile server TypeScript
- `pnpm typecheck` — type-check both server and client

## Endpoints
- GET /api/members — list active members
- POST /api/members — create member (name, email, role, department, start_date)
- GET /api/members/:id — get member by ID
- PATCH /api/members/:id — update member fields
- DELETE /api/members/:id — remove member
- GET /api/members/export — CSV export (HR integration)
- GET /api/members/stats — team statistics by department

## Rules
- API errors: `{ "error": string }` with appropriate HTTP status
- Prefer parameterized SQL (`?` placeholders) — no string concatenation
- SQLite via Node built-in `node:sqlite` (`DatabaseSync`), requires Node >= 22.5

---

## Deferred implementation contract — JRPRAKHARS-16 (BambooHR dept_code validation)

**Status: BLOCKED — do not implement until all three unblock answers arrive from People Ops (#people-ops).**

The three required answers (requested in step 3 of the implementation plan):
- **(a)** The authoritative `dept_code` ↔ `dept_name` CSV for this quarter.
- **(b)** Confirmed column-order decision for the BambooHR CSV export (replace position-5 `department` with `dept_code`? append as column 8? other?).
- **(c)** Migration mapping for the two invalid seed rows (`"Eng"` → `?`, `"Human Resources"` → `?`).

Once those arrive, the follow-up plan must implement exactly the four pieces below. **Do not guess the codes or the column order — the ticket explicitly forbids it.**

### 1 — `server/src/departments.ts` (validation utility)

Create a new module that exports:
- `DEPT_CODES: readonly string[]` — the authoritative list, sourced verbatim from the People Ops CSV (answer a). Alternatively the CSV itself can live at `data/departments.csv` (gitignored if it contains PII, checked-in otherwise) and be loaded at startup.
- `isValidDeptCode(code: string): boolean` — convenience predicate used by the route handlers.
- `allowedCodesMessage(): string` — builds the human-readable list for error responses, e.g. `"Allowed dept_code values: ENG, PROD, DESIGN, …"`.

The module must be the **single source of truth** — routes and the seed both import from it; the list must not be duplicated.

### 2 — `POST /api/members` and `PATCH /api/members/:id` — dept_code validation

Both write paths must reject an unknown `dept_code` before touching the database:

```
// sketch — exact codes unknown until answer (a) arrives
if (dept_code !== undefined && !isValidDeptCode(dept_code)) {
  res.status(400).json({
    error: `Invalid dept_code "${dept_code}". ${allowedCodesMessage()}`
  });
  return;
}
```

Error shape follows the existing CLAUDE.md convention: `{ "error": string }` with HTTP 400.

`POST /api/members` should treat a missing `dept_code` as a required-field error (same 400 path as the existing missing-field check).  
`PATCH /api/members/:id` should only validate `dept_code` when it is present in the request body (partial update).

### 3 — `GET /api/members/export` — emit `dept_code` per People Ops column-order decision

The current export header is `id,name,email,role,department,start_date,is_active` (7 columns, BambooHR positional).

**Do not change a single column until answer (b) is in hand.** Then apply exactly one of these patterns — whichever People Ops confirms:

| Answer (b) says | Change to make |
|---|---|
| Replace `department` (col 5) with `dept_code` | Change header position 5 to `dept_code`; emit `r.dept_code` there; confirm BambooHR mapping updated |
| Append `dept_code` as column 8 | Add `,dept_code` to header; emit `,${r.dept_code}` at end; confirm BambooHR mapping updated before deploy |
| Other arrangement | Follow People Ops spec exactly |

The `MemberRow` interface in `members.ts` and the `members` table schema in `db.ts` must both gain a `dept_code TEXT NOT NULL` column to support whichever layout is chosen.

### 4 — `server/src/db.ts` — migrate seed rows to valid codes

The two invalid seed rows must be updated using the mapping from answer (c):

```
// sketch — exact target codes unknown until answer (c) arrives
insert.run('David Kim',  ..., /* dept_code: answer(c) mapping for "Eng" */,          '2023-06-20');
insert.run('Grace Lin',  ..., /* dept_code: answer(c) mapping for "Human Resources" */, '2021-04-01');
insert.run('Hiro Tanaka', ..., /* dept_code: answer(c) mapping for "Eng" */,          '2023-09-12');
```

If the database already contains the invalid rows (i.e., it was seeded before this fix lands), a one-time migration statement must be added inside `getDb()` to UPDATE those rows to the corrected codes.

### Schema change reminder

Per CLAUDE.md team process: any PR that modifies the `members` table schema requires People Ops review before merging (BambooHR compatibility). Tag them on the PR once the above is implemented.

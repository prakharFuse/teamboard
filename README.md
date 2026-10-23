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

All deployment configuration lives in `src/config.js`: `DEFAULTS` holds the
compile-time values and `loadConfig(env)` overlays validated `TEAMBOARD_*`
environment overrides on top of them.

| Key | Env var | Default | Validation |
| --- | --- | --- | --- |
| `api.baseUrl` | `TEAMBOARD_API_BASE_URL` | `https://api.teamboard.example.com/v1` | `http:` or `https:` URL |
| `api.region` | `TEAMBOARD_API_REGION` | `us-east-1` | non-empty after trimming. Reserved: not yet sent upstream |
| `api.timeoutMs` | `TEAMBOARD_API_TIMEOUT_MS` | `15000` | integer 1..2147483647 (the `setTimeout` maximum) |
| `api.maxAttempts` | `TEAMBOARD_API_MAX_ATTEMPTS` | `3` | integer 1..10 |
| `api.backoffBaseMs` | `TEAMBOARD_API_BACKOFF_BASE_MS` | `250` | integer 0..60000 |
| `api.pageSize` | `TEAMBOARD_API_PAGE_SIZE` | `50` | integer 1..1000 |
| `log.level` | `TEAMBOARD_LOG_LEVEL` | `info` | exactly one of `debug`, `info`, `warn`, `error` |

Integers must be plain decimal digits: `1.5`, `abc`, `0x10`, `1e3` and ` 12 `
are rejected.

### Conventions

- Env vars are named `TEAMBOARD_<SECTION>_<KEY>`, with a unit suffix where the
  value has one (`_MS`).
- Precedence: CLI flag > env var > `DEFAULTS`. For example `--verbose` wins over
  `TEAMBOARD_LOG_LEVEL`.
- An empty value (`TEAMBOARD_LOG_LEVEL=`) means unset.
- Env is applied only by the CLI (`src/index.js`). `new ApiClient()` on its own
  uses `DEFAULTS`.
- `TEAMBOARD_LOG_LEVEL=warn` hides the `status` output, which is logged at
  `info`.
- Base URLs have no trailing slash.
- A bad value fails fast: `loadConfig` throws, `main()` logs `fatal` on stderr
  with the variable name (never the value) and the exit code is 1. This applies
  to every command, including `status` and `--help`.

### Audit summary

Moved to config: the API base URL, region, request timeout, retry attempts,
backoff base, page size and log level.

Kept inline, on purpose:

- the store `DEFAULTS` in `src/store.js`: user-editable application settings,
  not deployment config;
- the logger `LEVELS` table: numeric ordering is logger semantics;
- the backoff exponent `2 **` in `ApiClient.request`: the doubling is the
  algorithm, not a tunable;
- `listTasks(1)` in `src/index.js`: the CLI lists the first page.

There are no credentials or credential placeholders in this repository. Any
future secret must come from the environment and must never be echoed in error
messages or logs.

### Adding a config value

1. Add the field to the typedef in `src/config.js`.
2. Add its entry to `DEFAULTS`.
3. Add a row to `ENV_SCHEMA` (section, key, env var, parser).
4. Use it from the consumer, reading it from the config object.
5. Add a row to the table above.
6. Add tests in `test/config.test.js`.

### Overriding at runtime

```bash
TEAMBOARD_API_TIMEOUT_MS=5000 TEAMBOARD_LOG_LEVEL=debug npm start -- tasks
```

### How the contract is enforced

- `// @ts-check` and the JSDoc typedefs (`ApiConfig`, `LogConfig`, `Config`)
  give editors type checking. The project has no TypeScript dependency, so
  nothing runs a type check in `npm test`.
- Runtime parsers validate every env value and fail fast through the fatal
  path with exit code 1.
- `DEFAULTS` and the object returned by `loadConfig` are deep-frozen.
- `test/config.test.js` covers defaults, overrides, boundaries and rejections.

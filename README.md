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

## Contributing

Please open an issue before submitting a pull request.

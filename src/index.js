#!/usr/bin/env node
/**
 * CLI entrypoint.
 *
 * FIXTURE NOTE: the arg parser below is what makes the `--quiet` fixture
 * answerable — an agent has somewhere to add the flag and somewhere
 * (src/logger.js) to apply it.
 *
 * `--workspace=<slug>` (TEAM-8) scopes `status` and `tasks` to one workspace.
 * Omitting it keeps the legacy behaviour: Parent Co settings and no
 * `X-Workspace-Id` header.
 */
import { logger, setLevel } from './logger.js';
import { ApiClient } from './api-client.js';
import { allSettings, getSetting } from './store.js';
import { WORKSPACES, getWorkspaceBySlug } from './workspaces.js';

const WORKSPACE_FLAG = '--workspace=';

function parseArgs(argv) {
  const opts = { command: 'status', verbose: false, workspace: undefined };
  for (const arg of argv) {
    if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg.startsWith(WORKSPACE_FLAG)) opts.workspace = arg.slice(WORKSPACE_FLAG.length);
    else if (!arg.startsWith('-')) opts.command = arg;
  }
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'teamboard — fixture task-tracking CLI',
      '',
      'Usage: teamboard <command> [options]',
      '',
      'Commands:',
      '  status     show current settings',
      '  tasks      list the first page of tasks',
      '  workspaces list the known workspaces',
      '',
      'Options:',
      '  --workspace=<slug>  scope status/tasks to a workspace (default: Parent Co)',
      '  --verbose  include debug output',
      '  -h, --help show this message',
      '',
    ].join('\n'),
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.verbose) setLevel('debug');

  if (opts.command === 'help') {
    printHelp();
    return;
  }

  const workspace = opts.workspace === undefined ? undefined : getWorkspaceBySlug(opts.workspace);
  if (opts.workspace !== undefined && !workspace) {
    logger.error('unknown workspace', { workspace: opts.workspace });
    process.exitCode = 1;
    return;
  }

  if (opts.command === 'status') {
    logger.info('current settings', allSettings(workspace?.id));
    return;
  }

  if (opts.command === 'workspaces') {
    logger.info('workspaces', WORKSPACES.map(({ id, slug, name }) => ({ id, slug, name })));
    return;
  }

  if (opts.command === 'tasks') {
    const client = workspace ? new ApiClient(undefined, { workspaceId: workspace.id }) : new ApiClient();
    logger.debug('listing tasks', { retention: getSetting('retention.days', workspace?.id) });
    const page = await client.listTasks(1);
    logger.info(`fetched ${Array.isArray(page) ? page.length : 0} task(s)`);
    return;
  }

  logger.error(`unknown command: ${opts.command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  logger.error('fatal', { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});

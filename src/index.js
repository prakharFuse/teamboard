#!/usr/bin/env node
/**
 * CLI entrypoint.
 *
 * FIXTURE NOTE: the arg parser below is what makes the `--quiet` fixture
 * answerable — an agent has somewhere to add the flag and somewhere
 * (src/logger.js) to apply it.
 */
import { logger, setLevel } from './logger.js';
import { ApiClient } from './api-client.js';
import { allSettings, getSetting } from './store.js';
import { getWorkspace } from './workspaces.js';

function parseArgs(argv) {
  const opts = { command: 'status', verbose: false, workspace: undefined, error: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg === '--workspace' || arg.startsWith('--workspace=')) {
      // Consume the value so `--workspace <slug>` is not mistaken for the command.
      const value = arg === '--workspace' ? argv[++i] : arg.slice('--workspace='.length);
      if (!value || value.startsWith('-')) {
        opts.error = 'missing value for --workspace';
        break;
      }
      opts.workspace = value;
    } else if (!arg.startsWith('-')) opts.command = arg;
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
      '',
      'Options:',
      '  --workspace <slug>  run against a workspace (default: parent-co)',
      '  --verbose  include debug output',
      '  -h, --help show this message',
      '',
    ].join('\n'),
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.verbose) setLevel('debug');

  if (opts.error) {
    logger.error(opts.error);
    process.exitCode = 1;
    return;
  }

  if (opts.command === 'help') {
    printHelp();
    return;
  }

  if (opts.workspace !== undefined) {
    try {
      getWorkspace(opts.workspace);
    } catch (error) {
      logger.error(error.message);
      process.exitCode = 1;
      return;
    }
  }

  if (opts.command === 'status') {
    if (opts.workspace === undefined) logger.info('current settings', allSettings());
    else logger.info('current settings', { workspaceId: opts.workspace, ...allSettings(opts.workspace) });
    return;
  }

  if (opts.command === 'tasks') {
    const client = new ApiClient(undefined, { workspaceId: opts.workspace });
    logger.debug('listing tasks', { retention: getSetting('retention.days', opts.workspace) });
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

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

function parseArgs(argv) {
  const opts = { command: 'status', verbose: false, workspace: undefined, error: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg === '--workspace') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('-')) opts.error = 'missing value for --workspace';
      else {
        opts.workspace = next;
        i += 1;
      }
    } else if (arg.startsWith('--workspace=')) {
      const v = arg.slice('--workspace='.length);
      if (v) opts.workspace = v;
      else opts.error = 'missing value for --workspace';
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
      '  --verbose  include debug output',
      '  --workspace <slug>  scope the command to a workspace (default: parent-co)',
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

  if (opts.command === 'status') {
    logger.info('current settings', allSettings());
    return;
  }

  if (opts.command === 'tasks') {
    const client = new ApiClient();
    logger.debug('listing tasks', { retention: getSetting('retention.days') });
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

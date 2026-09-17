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
import { startServer } from './server.js';

function parseArgs(argv) {
  const opts = { command: 'status', verbose: false };
  for (const arg of argv) {
    if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
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
      '  serve      start the members API server',
      '',
      'Options:',
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

  if (opts.command === 'serve') {
    if (!process.env.TEAMBOARD_API_TOKEN) {
      logger.warn('TEAMBOARD_API_TOKEN is not set; members API requests will be unauthorized');
    }
    const server = await startServer();
    logger.info(`members API listening on port ${server.address().port}`);
    return;
  }

  logger.error(`unknown command: ${opts.command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  logger.error('fatal', { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});

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
import { BambooHrClient } from './bamboohr-client.js';
import { SsoClient } from './sso-client.js';
import { importFromBambooHR, deactivateMember, reconcilePendingDeprovisions, SSO_DEPROVISION_SLA_MS } from './member-lifecycle.js';

function parseArgs(argv) {
  const opts = { command: 'status', verbose: false, member: null };
  for (const arg of argv) {
    if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg.startsWith('--member=')) opts.member = arg.slice('--member='.length);
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
      '  status                 show current settings',
      '  tasks                  list the first page of tasks',
      '  members:import         sync members from BambooHR',
      '  members:deactivate     deactivate a member and deprovision their SSO access',
      '  members:reconcile-sso  retry SSO deprovisioning for members past the SLA',
      '',
      'Options:',
      '  --verbose      include debug output',
      '  --member=<id>  member id (required for members:deactivate)',
      '  -h, --help     show this message',
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

  if (opts.command === 'members:import') {
    const client = new BambooHrClient();
    const summary = await importFromBambooHR({ client });
    logger.info('BambooHR import summary', summary);
    if (summary.failed.length > 0) process.exitCode = 1;
    return;
  }

  if (opts.command === 'members:deactivate') {
    if (!opts.member) {
      logger.error('members:deactivate requires --member=<id>');
      process.exitCode = 1;
      return;
    }
    const ssoClient = new SsoClient();
    const result = await deactivateMember(opts.member, { ssoClient, now: Date.now() });
    logger.info('member deactivation result', { memberId: opts.member, ok: result.ok });
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (opts.command === 'members:reconcile-sso') {
    const ssoClient = new SsoClient();
    const summary = await reconcilePendingDeprovisions({
      ssoClient,
      now: Date.now(),
      slaMs: SSO_DEPROVISION_SLA_MS,
    });
    logger.info('SSO reconciliation summary', summary);
    if (summary.failed.length > 0) process.exitCode = 1;
    return;
  }

  logger.error(`unknown command: ${opts.command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  logger.error('fatal', { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});

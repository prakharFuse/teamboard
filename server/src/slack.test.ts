/**
 * Slack notifier tests.
 *
 * No test framework dependency — Node's built-in test runner, matching
 * members.test.ts conventions. The "webhook configured" cases point
 * notifyFailure at an in-process stub HTTP server (never a real webhook URL).
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { notifyFailure } from './slack.js';
import type { FailureContext } from './slack.js';

const ORIGINAL_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

beforeEach(() => {
  delete process.env.SLACK_WEBHOOK_URL;
});

afterEach(() => {
  if (ORIGINAL_WEBHOOK_URL === undefined) {
    delete process.env.SLACK_WEBHOOK_URL;
  } else {
    process.env.SLACK_WEBHOOK_URL = ORIGINAL_WEBHOOK_URL;
  }
});

const context: FailureContext = {
  operation: 'SyncMembers',
  severity: 'high',
  environment: 'staging',
  timestamp: '2026-08-21T00:00:00.000Z',
  error: 'connection refused',
};

async function withStubServer(
  handler: (body: string) => { status: number; body: string },
  fn: (url: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const { status, body: responseBody } = handler(body);
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end(responseBody);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test('notifyFailure no-ops and returns false when SLACK_WEBHOOK_URL is unset', async () => {
  const result = await notifyFailure(context);
  assert.equal(result, false);
});

test('notifyFailure posts a JSON body with text and blocks, and returns true on success', async () => {
  let capturedBody = '';
  await withStubServer(
    (body) => {
      capturedBody = body;
      return { status: 200, body: 'ok' };
    },
    async (url) => {
      process.env.SLACK_WEBHOOK_URL = url;
      const result = await notifyFailure(context);
      assert.equal(result, true);
    },
  );

  const payload = JSON.parse(capturedBody) as { text: unknown; blocks: unknown[] };
  assert.equal(typeof payload.text, 'string');
  assert.ok((payload.text as string).length > 0, 'text is non-empty');
  assert.ok(Array.isArray(payload.blocks), 'blocks is an array');
  assert.ok(
    JSON.stringify(payload.blocks).includes(context.operation),
    'blocks reference the failing operation',
  );
});

test('notifyFailure swallows a non-ok response and returns false without throwing', async () => {
  await withStubServer(
    () => ({ status: 500, body: 'internal_error' }),
    async (url) => {
      process.env.SLACK_WEBHOOK_URL = url;
      const result = await notifyFailure(context);
      assert.equal(result, false);
    },
  );
});

test('notifyFailure swallows a network error and returns false without throwing', async () => {
  // Bind and immediately close a server to obtain a port nothing is
  // listening on, so the POST fails with an ECONNREFUSED-style network error.
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve) => server.close(() => resolve()));

  process.env.SLACK_WEBHOOK_URL = `http://127.0.0.1:${port}`;
  const result = await notifyFailure(context);
  assert.equal(result, false);
});

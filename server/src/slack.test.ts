import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyFailure } from './slack.js';

interface FetchCall {
  url: string;
  init: RequestInit;
}

function stubFetch(response: { ok: boolean; status: number; text: () => Promise<string> }): {
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return response as unknown as Response;
  }) as typeof fetch;
  return { calls };
}

test('notifyFailure posts a well-formed payload to the configured webhook', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.SLACK_WEBHOOK_URL;
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';
  const { calls } = stubFetch({ ok: true, status: 200, text: async () => 'ok' });

  try {
    await notifyFailure({ operation: 'POST /api/members', error: new Error('boom') });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://hooks.slack.com/services/T000/B000/XXXX');
    assert.equal(calls[0].init.method, 'POST');
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers['Content-Type'], 'application/json');

    const payload = JSON.parse(calls[0].init.body as string) as { text: unknown; blocks: unknown };
    assert.equal(typeof payload.text, 'string');
    assert.ok((payload.text as string).length > 0);
    assert.ok(Array.isArray(payload.blocks));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhook === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = originalWebhook;
    }
  }
});

test('notifyFailure escapes mrkdwn-sensitive characters in the error message', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.SLACK_WEBHOOK_URL;
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';
  const { calls } = stubFetch({ ok: true, status: 200, text: async () => 'ok' });

  try {
    await notifyFailure({ operation: 'POST /api/members', error: new Error('<b>&</b>') });

    const payload = JSON.parse(calls[0].init.body as string) as { text: string };
    assert.ok(payload.text.includes('&lt;'));
    assert.ok(payload.text.includes('&gt;'));
    assert.ok(payload.text.includes('&amp;'));
    assert.equal(/<|>/.test(payload.text), false);
    assert.equal(/&(?!amp;|lt;|gt;)/.test(payload.text), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhook === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = originalWebhook;
    }
  }
});

test('notifyFailure does not call fetch when SLACK_WEBHOOK_URL is unset', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.SLACK_WEBHOOK_URL;
  delete process.env.SLACK_WEBHOOK_URL;
  const { calls } = stubFetch({ ok: true, status: 200, text: async () => 'ok' });

  try {
    await assert.doesNotReject(() =>
      notifyFailure({ operation: 'POST /api/members', error: new Error('boom') }),
    );
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhook === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = originalWebhook;
    }
  }
});

test('notifyFailure does not throw when Slack responds with a non-ok status', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.SLACK_WEBHOOK_URL;
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';
  let textCalled = false;
  let jsonCalled = false;
  globalThis.fetch = (async () => {
    return {
      ok: false,
      status: 500,
      text: async () => {
        textCalled = true;
        return 'invalid_payload';
      },
      json: async () => {
        jsonCalled = true;
        return {};
      },
    } as unknown as Response;
  }) as typeof fetch;

  try {
    await assert.doesNotReject(() =>
      notifyFailure({ operation: 'POST /api/members', error: new Error('boom') }),
    );
    assert.equal(textCalled, true);
    assert.equal(jsonCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhook === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = originalWebhook;
    }
  }
});

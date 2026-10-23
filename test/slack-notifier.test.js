import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { setLevel } from '../src/logger.js';
import {
  buildFailurePayload,
  getWebhookUrl,
  notifyFailure,
  postSlackMessage,
} from '../src/slack-notifier.js';

function stubFetch({ ok = true, status = 200, body = 'ok' } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok, status, text: async () => body };
  };
  return { calls, fetchImpl };
}

test('getWebhookUrl returns undefined when the variable is missing', () => {
  assert.equal(getWebhookUrl({}), undefined);
});

test('getWebhookUrl returns undefined when the variable is blank', () => {
  assert.equal(getWebhookUrl({ TEAMBOARD_SLACK_WEBHOOK_URL: '   ' }), undefined);
});

test('getWebhookUrl returns the trimmed value', () => {
  assert.equal(
    getWebhookUrl({ TEAMBOARD_SLACK_WEBHOOK_URL: ' https://hooks.example.test/x ' }),
    'https://hooks.example.test/x',
  );
});

test('buildFailurePayload builds text and blocks with escaping and fields', () => {
  const payload = buildFailurePayload({
    operation: 'tasks',
    error: new Error('boom <x> & y'),
    details: { attempt: 3 },
  });
  assert.deepEqual(payload, {
    text: 'teamboard: tasks failed: boom &lt;x&gt; &amp; y',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':rotating_light: *tasks* failed\nboom &lt;x&gt; &amp; y',
        },
      },
      {
        type: 'section',
        fields: [{ type: 'mrkdwn', text: '*attempt*\n3' }],
      },
    ],
  });
});

test('buildFailurePayload without error or details has one block', () => {
  const payload = buildFailurePayload({ operation: 'o' });
  assert.equal(payload.text, 'teamboard: o failed: unknown error');
  assert.equal(payload.blocks.length, 1);
});

test('buildFailurePayload renders a string error as is', () => {
  const payload = buildFailurePayload({ operation: 'o', error: 'nope' });
  assert.equal(payload.text, 'teamboard: o failed: nope');
});

test('buildFailurePayload truncates a long message to 500 chars plus an ellipsis', () => {
  const payload = buildFailurePayload({ operation: 'o', error: 'a'.repeat(600) });
  assert.equal(payload.text, `teamboard: o failed: ${'a'.repeat(500)}…`);
});

test('buildFailurePayload truncates before escaping', () => {
  const payload = buildFailurePayload({ operation: 'o', error: '&'.repeat(600) });
  assert.equal(payload.text, `teamboard: o failed: ${'&amp;'.repeat(500)}…`);
});

test('buildFailurePayload truncates long detail keys and values', () => {
  const payload = buildFailurePayload({
    operation: 'o',
    details: { ['k'.repeat(60)]: 'v'.repeat(400) },
  });
  assert.equal(
    payload.blocks[1].fields[0].text,
    `*${'k'.repeat(50)}…*\n${'v'.repeat(300)}…`,
  );
});

test('buildFailurePayload caps details at 10 fields', () => {
  const details = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, i]));
  const payload = buildFailurePayload({ operation: 'o', details });
  assert.equal(payload.blocks[1].fields.length, 10);
});

test('buildFailurePayload omits the fields block for empty details', () => {
  const payload = buildFailurePayload({ operation: 'o', details: {} });
  assert.equal(payload.blocks.length, 1);
});

test('postSlackMessage posts JSON to the webhook url', async () => {
  const { calls, fetchImpl } = stubFetch();
  const payload = { text: 'x' };
  await postSlackMessage(payload, { webhookUrl: 'https://hooks.example.test/x', fetchImpl });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://hooks.example.test/x');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].init.body), payload);
});

test('postSlackMessage rejects on a non-2xx response', async () => {
  const { fetchImpl } = stubFetch({ ok: false, status: 400, body: 'invalid_payload' });
  await assert.rejects(
    postSlackMessage({ text: 'x' }, { webhookUrl: 'https://hooks.example.test/x', fetchImpl }),
    /Slack webhook responded 400: invalid_payload/,
  );
});

test('postSlackMessage rejects when no webhook url is configured', async () => {
  await assert.rejects(
    postSlackMessage({ text: 'x' }, { webhookUrl: '' }),
    /TEAMBOARD_SLACK_WEBHOOK_URL is not set/,
  );
});

test('notifyFailure resolves false without fetching when unconfigured', async () => {
  const { calls, fetchImpl } = stubFetch();
  const result = await notifyFailure({ operation: 'o' }, { webhookUrl: '', fetchImpl });
  assert.equal(result, false);
  assert.equal(calls.length, 0);
});

test('notifyFailure resolves true when Slack accepts the message', async () => {
  const { fetchImpl } = stubFetch();
  const result = await notifyFailure(
    { operation: 'o' },
    { webhookUrl: 'https://hooks.example.test/x', fetchImpl },
  );
  assert.equal(result, true);
});

test('notifyFailure resolves false when Slack rejects the message', async () => {
  const { fetchImpl } = stubFetch({ ok: false, status: 404, body: 'no_service' });
  setLevel('error');
  try {
    const result = await notifyFailure(
      { operation: 'o' },
      { webhookUrl: 'https://hooks.example.test/x', fetchImpl },
    );
    assert.equal(result, false);
  } finally {
    setLevel('info');
  }
});

test('notifyFailure resolves false and does not throw when fetch throws', async () => {
  const fetchImpl = async () => {
    throw new TypeError('Failed to parse URL from https://secret');
  };
  setLevel('error');
  try {
    const result = await notifyFailure(
      { operation: 'o' },
      { webhookUrl: 'https://secret', fetchImpl },
    );
    assert.equal(result, false);
  } finally {
    setLevel('info');
  }
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { SsoClient } from '../src/sso-client.js';

const FAKE_TOKEN = 'test-fake-sso-token-do-not-use';

test('deprovision issues exactly one POST request containing the member id', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };
  const client = new SsoClient({ fetchImpl, token: FAKE_TOKEN });

  await client.deprovision('member-42');

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /member-42/);
  assert.equal(calls[0].init.method, 'POST');
});

test('an ok response with an empty body resolves without throwing', async () => {
  const fetchImpl = async () => ({ ok: true, status: 204 });
  const client = new SsoClient({ fetchImpl, token: FAKE_TOKEN });

  await assert.doesNotReject(() => client.deprovision('member-42'));
});

test('a 503 response throws an error naming the status', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 });
  const client = new SsoClient({ fetchImpl, token: FAKE_TOKEN });

  await assert.rejects(() => client.deprovision('member-42'), /503/);
});

test('a client with no token throws Missing SSO_API_TOKEN, issues zero calls, and never echoes the token', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };
  const client = new SsoClient({ fetchImpl, token: '' });

  let thrownMessage;
  try {
    await client.deprovision('member-42');
    assert.fail('expected deprovision to throw');
  } catch (error) {
    thrownMessage = error.message;
  }

  assert.match(thrownMessage, /Missing SSO_API_TOKEN/);
  assert.equal(calls.length, 0);
  assert.doesNotMatch(thrownMessage, new RegExp(FAKE_TOKEN));
  assert.equal(JSON.stringify(calls).includes(FAKE_TOKEN), false);
});

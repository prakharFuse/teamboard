import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DEFAULTS, LOG_LEVELS, loadConfig } from '../src/config.js';
import { setLevel } from '../src/logger.js';

test('loadConfig with an empty env returns DEFAULTS', () => {
  assert.deepStrictEqual(loadConfig({}), DEFAULTS);
});

test('loadConfig applies every override with numbers as numbers', () => {
  const config = loadConfig({
    TEAMBOARD_API_BASE_URL: 'http://localhost:8080/v1',
    TEAMBOARD_API_REGION: 'eu-west-1',
    TEAMBOARD_API_TIMEOUT_MS: '5000',
    TEAMBOARD_API_MAX_ATTEMPTS: '5',
    TEAMBOARD_API_BACKOFF_BASE_MS: '0',
    TEAMBOARD_API_PAGE_SIZE: '10',
    TEAMBOARD_LOG_LEVEL: 'debug',
  });
  assert.deepStrictEqual(config, {
    api: {
      baseUrl: 'http://localhost:8080/v1',
      region: 'eu-west-1',
      timeoutMs: 5000,
      maxAttempts: 5,
      backoffBaseMs: 0,
      pageSize: 10,
    },
    log: { level: 'debug' },
  });
});

test('loadConfig treats empty values as unset', () => {
  const config = loadConfig({ TEAMBOARD_LOG_LEVEL: '', TEAMBOARD_API_PAGE_SIZE: '' });
  assert.equal(config.log.level, 'info');
  assert.equal(config.api.pageSize, 50);
});

test('loadConfig accepts boundary values', () => {
  const config = loadConfig({
    TEAMBOARD_API_TIMEOUT_MS: '2147483647',
    TEAMBOARD_API_MAX_ATTEMPTS: '1',
  });
  assert.equal(config.api.timeoutMs, 2147483647);
  assert.equal(config.api.maxAttempts, 1);
});

test('config objects are frozen and loadConfig does not change DEFAULTS', () => {
  const before = JSON.stringify(DEFAULTS);
  const config = loadConfig({ TEAMBOARD_API_PAGE_SIZE: '10' });
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.api));
  assert.ok(Object.isFrozen(DEFAULTS));
  assert.ok(Object.isFrozen(DEFAULTS.api));
  assert.equal(JSON.stringify(DEFAULTS), before);
});

test('every LOG_LEVELS entry is accepted by setLevel', () => {
  try {
    for (const level of LOG_LEVELS) {
      assert.doesNotThrow(() => setLevel(level));
    }
  } finally {
    setLevel('info');
  }
});

test('TEAMBOARD_API_TIMEOUT_MS rejects a non-numeric value without echoing it', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_TIMEOUT_MS: 'abc' }), /TEAMBOARD_API_TIMEOUT_MS/);
  assert.throws(
    () => loadConfig({ TEAMBOARD_API_TIMEOUT_MS: 'abc' }),
    (error) => error instanceof Error && !error.message.includes('abc'),
  );
});

test('TEAMBOARD_API_TIMEOUT_MS rejects a fractional value', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_TIMEOUT_MS: '1.5' }), /TEAMBOARD_API_TIMEOUT_MS/);
});

test('TEAMBOARD_API_TIMEOUT_MS rejects a value above the setTimeout maximum', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_TIMEOUT_MS: '2147483648' }), /TEAMBOARD_API_TIMEOUT_MS/);
});

test('TEAMBOARD_API_MAX_ATTEMPTS rejects zero', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_MAX_ATTEMPTS: '0' }), /TEAMBOARD_API_MAX_ATTEMPTS/);
});

test('TEAMBOARD_API_MAX_ATTEMPTS rejects a negative value', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_MAX_ATTEMPTS: '-1' }), /TEAMBOARD_API_MAX_ATTEMPTS/);
});

test('TEAMBOARD_API_PAGE_SIZE rejects zero', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_PAGE_SIZE: '0' }), /TEAMBOARD_API_PAGE_SIZE/);
});

test('TEAMBOARD_LOG_LEVEL rejects an unknown level', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_LOG_LEVEL: 'chatty' }), /TEAMBOARD_LOG_LEVEL/);
});

test('TEAMBOARD_LOG_LEVEL is case sensitive', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_LOG_LEVEL: 'INFO' }), /TEAMBOARD_LOG_LEVEL/);
});

test('TEAMBOARD_API_BASE_URL rejects a non-http protocol', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_BASE_URL: 'ftp://x' }), /TEAMBOARD_API_BASE_URL/);
});

test('TEAMBOARD_API_BASE_URL rejects a string that is not a URL', () => {
  assert.throws(() => loadConfig({ TEAMBOARD_API_BASE_URL: 'not a url' }), /TEAMBOARD_API_BASE_URL/);
});

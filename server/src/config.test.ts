import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { loadConfig } from './config.js';

test('loadConfig({}) returns exact defaults', () => {
  const result = loadConfig({});
  assert.deepEqual(result, {
    port: 4060,
    host: 'localhost',
    dbPath: path.join(process.cwd(), 'data', 'team.db'),
    csvFileName: 'members.csv',
  });
});

test('loadConfig sets dbPath from TEAMBOARD_DB_PATH', () => {
  const result = loadConfig({ TEAMBOARD_DB_PATH: ':memory:' });
  assert.equal(result.dbPath, ':memory:');
});

test('loadConfig sets port from TEAMBOARD_PORT', () => {
  const result = loadConfig({ TEAMBOARD_PORT: '5000' });
  assert.equal(result.port, 5000);
});

test('loadConfig falls back to legacy PORT when TEAMBOARD_PORT is unset', () => {
  const result = loadConfig({ PORT: '3000' });
  assert.equal(result.port, 3000);
});

test('loadConfig falls back to default port on invalid TEAMBOARD_PORT', () => {
  const result = loadConfig({ TEAMBOARD_PORT: 'abc' });
  assert.equal(result.port, 4060);
});

test('loadConfig sets host and csvFileName from their env vars', () => {
  const result = loadConfig({
    TEAMBOARD_HOST: 'api.internal',
    TEAMBOARD_CSV_FILENAME: 'roster.csv',
  });
  assert.equal(result.host, 'api.internal');
  assert.equal(result.csvFileName, 'roster.csv');
});

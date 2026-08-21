/**
 * Config module unit tests.
 *
 * `config`'s fields are getters that read `process.env` on every access (see
 * config.ts), so tests mutate `process.env` around each assertion rather than
 * relying on import-time snapshots. Every mutated key is saved and restored
 * so tests don't leak env state into other test files that may share a
 * process (see server/src/routes/members.test.ts). `TEAMBOARD_DB_PATH` is
 * only ever set to placeholder strings here, never a real file — this suite
 * checks `config.dbPath`'s value, not `db.ts`'s filesystem behaviour.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { config } from './config.js';

function withEnv(overrides: Record<string, string | undefined>, fn: () => void): void {
  const saved = new Map<string, string | undefined>(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('port defaults to 4060 when no env vars are set', () => {
  withEnv({ TEAMBOARD_PORT: undefined, PORT: undefined }, () => {
    assert.equal(config.port, 4060);
  });
});

test('TEAMBOARD_PORT overrides the default port', () => {
  withEnv({ TEAMBOARD_PORT: '8080', PORT: undefined }, () => {
    assert.equal(config.port, 8080);
  });
});

test('legacy PORT overrides the default port when TEAMBOARD_PORT is unset', () => {
  withEnv({ TEAMBOARD_PORT: undefined, PORT: '9090' }, () => {
    assert.equal(config.port, 9090);
  });
});

test('TEAMBOARD_PORT takes precedence over legacy PORT when both are set', () => {
  withEnv({ TEAMBOARD_PORT: '8080', PORT: '9090' }, () => {
    assert.equal(config.port, 8080);
  });
});

test('a non-numeric TEAMBOARD_PORT falls back to the default port', () => {
  withEnv({ TEAMBOARD_PORT: 'not-a-number', PORT: undefined }, () => {
    assert.equal(config.port, 4060);
  });
});

test('host defaults to localhost when TEAMBOARD_HOST is unset', () => {
  withEnv({ TEAMBOARD_HOST: undefined }, () => {
    assert.equal(config.host, 'localhost');
  });
});

test('TEAMBOARD_HOST overrides the default host', () => {
  withEnv({ TEAMBOARD_HOST: '0.0.0.0' }, () => {
    assert.equal(config.host, '0.0.0.0');
  });
});

test('dbPath defaults to data/team.db under the working directory when TEAMBOARD_DB_PATH is unset', () => {
  withEnv({ TEAMBOARD_DB_PATH: undefined }, () => {
    assert.equal(config.dbPath, path.join(process.cwd(), 'data', 'team.db'));
  });
});

test('TEAMBOARD_DB_PATH overrides the default db path', () => {
  withEnv({ TEAMBOARD_DB_PATH: ':memory:' }, () => {
    assert.equal(config.dbPath, ':memory:');
  });
});

test('csvFilename defaults to members.csv when TEAMBOARD_CSV_FILENAME is unset', () => {
  withEnv({ TEAMBOARD_CSV_FILENAME: undefined }, () => {
    assert.equal(config.csvFilename, 'members.csv');
  });
});

test('TEAMBOARD_CSV_FILENAME overrides the default csv filename', () => {
  withEnv({ TEAMBOARD_CSV_FILENAME: 'team-export.csv' }, () => {
    assert.equal(config.csvFilename, 'team-export.csv');
  });
});

test('config values are evaluated lazily, reflecting env changes made after import', () => {
  withEnv({ TEAMBOARD_PORT: undefined, PORT: undefined }, () => {
    assert.equal(config.port, 4060, 'reads the default before any override is set');
    process.env.TEAMBOARD_PORT = '7000';
    assert.equal(config.port, 7000, 'reflects the override set after the module was imported');
    delete process.env.TEAMBOARD_PORT;
    assert.equal(config.port, 4060, 'reflects the override being removed again');
  });
});

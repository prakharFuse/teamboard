import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { setLevel } from '../src/logger.js';

// FIXTURE NOTE: the `tiers.medium` fixture says the --quiet change comes with
// "one unit test". This file is where that lands.

test('setLevel accepts a known level', () => {
  assert.doesNotThrow(() => setLevel('debug'));
  setLevel('info');
});

test('setLevel rejects an unknown level', () => {
  assert.throws(() => setLevel('chatty'), /Unknown log level/);
});

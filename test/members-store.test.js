import { strict as assert } from 'node:assert';
import { test, afterEach } from 'node:test';
import { listMembers, countActiveMembers, setMembers } from '../src/members-store.js';

const originalSeed = listMembers().map((member) => ({ ...member }));

afterEach(() => {
  setMembers(originalSeed.map((member) => ({ ...member })));
});

test('countActiveMembers returns the exact seeded active count', () => {
  assert.equal(countActiveMembers(), 3);
});

test('countActiveMembers is 0 after setMembers([])', () => {
  setMembers([]);
  assert.equal(countActiveMembers(), 0);
});

test('countActiveMembers is 0 when all records are is_active: 0', () => {
  setMembers([
    { id: 1, display_name: 'Fixture One', is_active: 0 },
    { id: 2, display_name: 'Fixture Two', is_active: 0 },
  ]);
  assert.equal(countActiveMembers(), 0);
});

test('countActiveMembers does not count is_active: true or is_active: "1"', () => {
  setMembers([
    { id: 1, display_name: 'Fixture Three', is_active: true },
    { id: 2, display_name: 'Fixture Four', is_active: '1' },
  ]);
  assert.equal(countActiveMembers(), 0);
});

test('listMembers reflects setMembers', () => {
  const replacement = [{ id: 99, display_name: 'Fixture Five', is_active: 1 }];
  setMembers(replacement);
  assert.deepEqual(listMembers(), replacement);
});

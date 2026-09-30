import { strict as assert } from 'node:assert';
import { test, beforeEach } from 'node:test';
import {
  _resetForTests,
  getWorkspace,
  listWorkspaces,
  registerWorkspace,
  resolveWorkspacesFromGroups,
} from '../src/workspaces.js';

const TEST_A = { id: 'ws-test-a', slug: 'test-a', name: 'Test A' };

beforeEach(() => {
  _resetForTests();
});

// Registry lookups

test('getWorkspace by id returns the exact seeded Parent Co entry', () => {
  assert.deepEqual(getWorkspace('ws-parent-co'), {
    id: 'ws-parent-co',
    slug: 'parent-co',
    name: 'Parent Co',
    bamboohrDeptCodeList: [],
    oktaGroup: 'tb-workspace-parent-co',
  });
});

test('getWorkspace by slug returns the same workspace as by id', () => {
  assert.equal(getWorkspace('parent-co').id, 'ws-parent-co');
});

test('getWorkspace throws for an unknown id', () => {
  assert.throws(() => getWorkspace('nope'), /Unknown workspace: nope/);
});

test('getWorkspace throws for null', () => {
  assert.throws(() => getWorkspace(null), /Unknown workspace/);
});

test('getWorkspace throws for an empty string', () => {
  assert.throws(() => getWorkspace(''), /Unknown workspace/);
});

test('registerWorkspace derives the Okta group from the slug and lists the entry', () => {
  const entry = registerWorkspace(TEST_A);
  assert.equal(entry.oktaGroup, 'tb-workspace-test-a');
  assert.equal(listWorkspaces().length, 2);
});

test('registerWorkspace rejects a duplicate id', () => {
  registerWorkspace(TEST_A);
  assert.throws(
    () => registerWorkspace({ id: 'ws-test-a', slug: 'test-a-2', name: 'Test A2' }),
    /already registered/,
  );
});

test('registerWorkspace rejects a duplicate slug under a new id', () => {
  registerWorkspace(TEST_A);
  assert.throws(
    () => registerWorkspace({ id: 'ws-test-a-2', slug: 'test-a', name: 'Test A2' }),
    /already registered/,
  );
});

test('registerWorkspace rejects an oktaGroup that does not match the slug', () => {
  assert.throws(() => registerWorkspace({ ...TEST_A, oktaGroup: 'tb-workspace-other' }));
  assert.equal(listWorkspaces().length, 1);
});

test('registerWorkspace returns a frozen entry', () => {
  const entry = registerWorkspace(TEST_A);
  // ES modules run in strict mode, so writing to a frozen object throws.
  assert.throws(() => {
    entry.name = 'Renamed';
  }, TypeError);
  assert.equal(getWorkspace('ws-test-a').name, 'Test A');
});

// resolveWorkspacesFromGroups

const ids = (workspaces) => workspaces.map((ws) => ws.id);

test('resolveWorkspacesFromGroups maps a tb-workspace group and ignores others', () => {
  assert.deepStrictEqual(ids(resolveWorkspacesFromGroups(['tb-workspace-parent-co', 'other-group'])), [
    'ws-parent-co',
  ]);
});

test('resolveWorkspacesFromGroups skips an unknown slug', () => {
  assert.deepStrictEqual(ids(resolveWorkspacesFromGroups(['tb-workspace-unknown'])), []);
});

test('resolveWorkspacesFromGroups matches the prefix case-sensitively', () => {
  assert.deepStrictEqual(ids(resolveWorkspacesFromGroups(['TB-WORKSPACE-parent-co'])), []);
});

test('resolveWorkspacesFromGroups de-duplicates repeated groups', () => {
  assert.deepStrictEqual(
    ids(resolveWorkspacesFromGroups(['tb-workspace-parent-co', 'tb-workspace-parent-co'])),
    ['ws-parent-co'],
  );
});

test('resolveWorkspacesFromGroups returns workspaces in first-seen group order', () => {
  registerWorkspace(TEST_A);
  assert.deepStrictEqual(
    ids(resolveWorkspacesFromGroups(['tb-workspace-test-a', 'tb-workspace-parent-co'])),
    ['ws-test-a', 'ws-parent-co'],
  );
});

test('resolveWorkspacesFromGroups returns [] for no groups', () => {
  assert.deepStrictEqual(ids(resolveWorkspacesFromGroups([])), []);
});

test('resolveWorkspacesFromGroups returns [] for undefined and never defaults to Parent Co', () => {
  assert.deepStrictEqual(ids(resolveWorkspacesFromGroups(undefined)), []);
});

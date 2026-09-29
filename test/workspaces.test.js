import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  DEFAULT_WORKSPACE_ID,
  PARENT_CO,
  getWorkspace,
  listWorkspaces,
  registerWorkspace,
  resolveWorkspacesFromGroups,
} from '../src/workspaces.js';

// The registry is module-global, so the test workspace is registered once here
// and every test below can rely on it regardless of run order.
const registered = registerWorkspace({ slug: 'test-ws-reg', name: 'Test Workspace', bamboohrDeptCodes: ['ENG'] });

test('Parent Co is the default workspace with all five fields', () => {
  assert.equal(DEFAULT_WORKSPACE_ID, 'parent-co');
  assert.deepEqual(PARENT_CO, {
    id: 'parent-co',
    slug: 'parent-co',
    name: 'Parent Co',
    bamboohrDeptCodes: [],
    oktaGroup: 'tb-workspace-parent-co',
  });
});

test('getWorkspace returns a registered workspace', () => {
  assert.equal(getWorkspace('parent-co'), PARENT_CO);
  assert.equal(getWorkspace('test-ws-reg'), registered);
});

test('getWorkspace throws for an unknown id', () => {
  assert.throws(() => getWorkspace('nope'), { message: 'Unknown workspace: nope' });
});

test('registerWorkspace derives id and oktaGroup from the slug', () => {
  assert.deepEqual(registered, {
    id: 'test-ws-reg',
    slug: 'test-ws-reg',
    name: 'Test Workspace',
    bamboohrDeptCodes: ['ENG'],
    oktaGroup: 'tb-workspace-test-ws-reg',
  });
  assert.ok(listWorkspaces().includes(registered));
});

test('registerWorkspace rejects a duplicate slug', () => {
  assert.throws(() => registerWorkspace({ slug: 'test-ws-reg' }), {
    message: 'Workspace already registered: test-ws-reg',
  });
  assert.throws(() => registerWorkspace({ slug: 'parent-co' }), /Workspace already registered: parent-co/);
});

test('registerWorkspace rejects a malformed slug', () => {
  for (const slug of ['Test-WS', 'test_ws', '-test', 'test-', 'test--ws', '', undefined]) {
    assert.throws(() => registerWorkspace({ slug }), /Invalid workspace slug/, `slug ${slug}`);
  }
});

test('resolveWorkspacesFromGroups keeps only registered tb-workspace groups', () => {
  const groups = ['everyone', 'tb-workspace-parent-co', 'tb-workspace-unregistered', 'x-tb-workspace-test-ws-reg'];
  assert.deepEqual(resolveWorkspacesFromGroups(groups), [PARENT_CO]);
});

test('resolveWorkspacesFromGroups returns each workspace once', () => {
  const groups = ['tb-workspace-parent-co', 'tb-workspace-test-ws-reg', 'tb-workspace-parent-co'];
  assert.deepEqual(resolveWorkspacesFromGroups(groups), [PARENT_CO, registered]);
});

test('resolveWorkspacesFromGroups is case-sensitive', () => {
  assert.deepEqual(resolveWorkspacesFromGroups(['TB-WORKSPACE-PARENT-CO', 'tb-workspace-Parent-Co']), []);
});

test('resolveWorkspacesFromGroups returns nothing for empty input', () => {
  assert.deepEqual(resolveWorkspacesFromGroups([]), []);
  assert.deepEqual(resolveWorkspacesFromGroups(), []);
});

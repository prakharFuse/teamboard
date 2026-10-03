import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  OKTA_GROUP_PREFIX,
  PARENT_CO_ID,
  WORKSPACES,
  assertWorkspaceAccess,
  getWorkspace,
  getWorkspaceBySlug,
  resolveUserWorkspaces,
} from '../src/workspaces.js';

test('registry lists Parent Co and the three subsidiaries', () => {
  assert.deepEqual(
    WORKSPACES.map((workspace) => workspace.name),
    ['Parent Co', 'Brightline', 'Northstar Logistics', 'Helio Studios'],
  );
  assert.equal(WORKSPACES[0].id, PARENT_CO_ID);
});

test('every workspace has the documented columns', () => {
  for (const workspace of WORKSPACES) {
    assert.deepEqual(Object.keys(workspace), ['id', 'slug', 'name', 'bamboohrDeptCodeList', 'oktaGroup']);
    assert.ok(Array.isArray(workspace.bamboohrDeptCodeList));
    assert.ok(workspace.bamboohrDeptCodeList.length > 0);
  }
});

test('every oktaGroup follows tb-workspace-<slug>', () => {
  assert.equal(OKTA_GROUP_PREFIX, 'tb-workspace-');
  for (const workspace of WORKSPACES) {
    assert.equal(workspace.oktaGroup, `tb-workspace-${workspace.slug}`);
  }
});

test('ids and slugs are unique', () => {
  assert.equal(new Set(WORKSPACES.map((w) => w.id)).size, WORKSPACES.length);
  assert.equal(new Set(WORKSPACES.map((w) => w.slug)).size, WORKSPACES.length);
});

test('registry and entries are frozen', () => {
  assert.ok(Object.isFrozen(WORKSPACES));
  for (const workspace of WORKSPACES) {
    assert.ok(Object.isFrozen(workspace));
    assert.ok(Object.isFrozen(workspace.bamboohrDeptCodeList));
  }
});

test('getWorkspace finds a workspace by id', () => {
  assert.equal(getWorkspace('ws_brightline').slug, 'brightline');
});

test('getWorkspace returns undefined for an unknown id', () => {
  assert.equal(getWorkspace('ws_nope'), undefined);
});

test('getWorkspaceBySlug finds a workspace by slug', () => {
  assert.equal(getWorkspaceBySlug('helio').id, 'ws_helio');
});

test('getWorkspaceBySlug returns undefined for an unknown slug', () => {
  assert.equal(getWorkspaceBySlug('nope'), undefined);
});

test('getWorkspaceBySlug is case-sensitive', () => {
  assert.equal(getWorkspaceBySlug('Brightline'), undefined);
});

test('resolveUserWorkspaces keeps only exact tb-workspace groups', () => {
  const resolved = resolveUserWorkspaces([
    'everyone',
    'tb-workspace-brightline',
    'tb-workspace-nope',
    'tb-admins',
    'xtb-workspace-helio',
  ]);
  assert.deepEqual(resolved.map((w) => w.name), ['Brightline']);
});

test('resolveUserWorkspaces deduplicates repeated groups', () => {
  const resolved = resolveUserWorkspaces(['tb-workspace-brightline', 'tb-workspace-brightline']);
  assert.deepEqual(resolved.map((w) => w.id), ['ws_brightline']);
});

test('resolveUserWorkspaces returns registry order regardless of group order', () => {
  const resolved = resolveUserWorkspaces(['tb-workspace-helio', 'tb-workspace-parent-co']);
  assert.deepEqual(resolved.map((w) => w.id), [PARENT_CO_ID, 'ws_helio']);
});

test('resolveUserWorkspaces rejects mixed-case groups', () => {
  assert.deepEqual(resolveUserWorkspaces(['TB-WORKSPACE-BRIGHTLINE', 'tb-workspace-Helio']), []);
});

test('resolveUserWorkspaces returns an empty list for no groups', () => {
  assert.deepEqual(resolveUserWorkspaces([]), []);
});

test('assertWorkspaceAccess throws a 403 error when denied', () => {
  assert.throws(
    () => assertWorkspaceAccess('ws_helio', ['ws_brightline']),
    (error) => error instanceof Error && error.status === 403 && error.message === 'Forbidden workspace: ws_helio',
  );
});

test('assertWorkspaceAccess does not throw when allowed', () => {
  assert.doesNotThrow(() => assertWorkspaceAccess('ws_brightline', [PARENT_CO_ID, 'ws_brightline']));
});

test('assertWorkspaceAccess with an empty allowed list denies Parent Co', () => {
  assert.throws(
    () => assertWorkspaceAccess(PARENT_CO_ID, []),
    (error) => error.status === 403 && error.message === `Forbidden workspace: ${PARENT_CO_ID}`,
  );
});

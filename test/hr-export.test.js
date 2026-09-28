import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { normalizeDepartment, buildExportRows, CANONICAL_DEPARTMENTS } from '../src/hr-export.js';

// Step 7: agreed alias groups from the March 2026 export contract.

test('normalizeDepartment maps Eng, Engg, and ENG aliases to Engineering', () => {
  assert.equal(normalizeDepartment('Eng'), 'Engineering');
  assert.equal(normalizeDepartment('Engg'), 'Engineering');
  assert.equal(normalizeDepartment('ENG'), 'Engineering');
});

test('normalizeDepartment maps Human Resources to HR', () => {
  assert.equal(normalizeDepartment('Human Resources'), 'HR');
});

test('normalizeDepartment maps IT to Operations, not Engineering', () => {
  assert.equal(normalizeDepartment('IT'), 'Operations');
  assert.notEqual(normalizeDepartment('IT'), 'Engineering');
});

test('normalizeDepartment maps Product & Design to Product', () => {
  assert.equal(normalizeDepartment('Product & Design'), 'Product');
});

// Step 8: canonical handling — pass-through, case/whitespace normalisation, and
// making sure bare "Design" isn't pulled into the "Product & Design" alias.

test('normalizeDepartment passes each canonical department name through byte-identical', () => {
  for (const name of CANONICAL_DEPARTMENTS) {
    assert.equal(normalizeDepartment(name), name);
  }
});

test('normalizeDepartment normalises differently-cased, padded canonical input to the canonical spelling', () => {
  assert.equal(normalizeDepartment(' engineering '), 'Engineering');
  assert.equal(normalizeDepartment(' Legal '), 'Legal');
});

test('normalizeDepartment leaves bare Design as Design rather than pulling it into Product', () => {
  assert.equal(normalizeDepartment('Design'), 'Design');
});

// Step 9: rejection paths — unmapped values, missing/non-string input, and
// near-miss variants that must not be fuzzy-matched.

test('normalizeDepartment rejects an unmapped value like Growth, naming it in the error', () => {
  assert.throws(() => normalizeDepartment('Growth'), /Growth/);
});

test('normalizeDepartment rejects missing department for blank input and refuses to coerce non-strings', () => {
  assert.throws(() => normalizeDepartment(undefined), /Missing department/);
  assert.throws(() => normalizeDepartment(null), /Missing department/);
  assert.throws(() => normalizeDepartment(''), /Missing department/);
  assert.throws(() => normalizeDepartment('   '), /Missing department/);
  assert.throws(() => normalizeDepartment(42), /Unmappable department/);
});

test('normalizeDepartment rejects near-miss variants instead of fuzzy-matching them to Product', () => {
  assert.throws(() => normalizeDepartment('Product and Design'), /Product and Design/);
  assert.throws(() => normalizeDepartment('Product/Design'), /Product\/Design/);
});

// Step 10: buildExportRows — partitioning a member batch into rows and rejections.

test('buildExportRows maps the mappable members and rejects the rest, preserving fields and order', () => {
  const members = [
    { id: 1, name: 'Alice', department: 'Eng' },
    { id: 2, name: 'Bob', department: 'Growth' },
    { id: 3, name: 'Carol', department: 'IT' },
    { id: 4, name: 'Dave' },
  ];

  const { rows, rejections } = buildExportRows(members);

  assert.deepEqual(rows.map((row) => row.department), ['Engineering', 'Operations']);
  assert.equal(rows[0].id, 1);
  assert.equal(rows[0].name, 'Alice');
  assert.equal(rows[1].id, 3);
  assert.equal(rows[1].name, 'Carol');
  assert.equal(rejections.length, 2);
  assert.match(rejections[0].reason, /Growth/);
  for (const row of rows) {
    assert.ok(CANONICAL_DEPARTMENTS.includes(row.department));
  }
});

test('buildExportRows rejects every member when none are mappable, without de-duplicating rejections', () => {
  const members = [
    { id: 1, name: 'Eve', department: 'Growth' },
    { id: 2, name: 'Frank', department: 'Growth' },
    { id: 3, name: 'Grace', department: '' },
  ];

  const { rows, rejections } = buildExportRows(members);

  assert.deepEqual(rows, []);
  assert.equal(rejections.length, 3);
});

test('buildExportRows returns empty rows and rejections for an empty member list', () => {
  assert.deepEqual(buildExportRows([]), { rows: [], rejections: [] });
});

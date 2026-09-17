/**
 * In-memory member directory.
 */
let members = [
  { id: 1, display_name: 'Ada Example', is_active: 1 },
  { id: 2, display_name: 'Grace Placeholder', is_active: 1 },
  { id: 3, display_name: 'Lin Sample', is_active: 1 },
  { id: 4, display_name: 'Sam Fixture', is_active: 0 },
];

export function listMembers() {
  return members;
}

// Strict `=== 1` mirrors the ticket's `is_active = 1` semantics exactly, so
// truthy-but-not-1 values (e.g. `true`, `'1'`) are never miscounted as active.
export function countActiveMembers() {
  return members.filter((member) => member.is_active === 1).length;
}

export function setMembers(records) {
  members = records;
}

// server/src/departments.test.ts
// Unit tests for the department mapping helpers — these guard the BambooHR import
// contract. A rename in departments.ts that breaks a legacy mapping should fail here
// before it ever reaches the Monday HR import.
import { describe, it, expect } from 'vitest';
import {
  legacyDeptToCode,
  isValidDeptCode,
  getDeptName,
  ALLOWED_DEPT_CODES,
  DEPT_CODE_TO_NAME,
} from './departments.js';

// ── legacyDeptToCode ──────────────────────────────────────────────────────────

describe('legacyDeptToCode — KB Doc 3 common mistakes', () => {
  it('"Eng" maps to ENGR', () => {
    expect(legacyDeptToCode('Eng')).toBe('ENGR');
  });

  it('"Engg" maps to ENGR', () => {
    expect(legacyDeptToCode('Engg')).toBe('ENGR');
  });

  it('"Human Resources" maps to HRES', () => {
    expect(legacyDeptToCode('Human Resources')).toBe('HRES');
  });

  it('unmappable string returns undefined', () => {
    expect(legacyDeptToCode('Foobar')).toBeUndefined();
  });
});

describe('legacyDeptToCode — case-insensitivity', () => {
  it('is case-insensitive for canonical names', () => {
    expect(legacyDeptToCode('ENGINEERING')).toBe('ENGR');
    expect(legacyDeptToCode('engineering')).toBe('ENGR');
    expect(legacyDeptToCode('Engineering')).toBe('ENGR');
  });

  it('is case-insensitive for legacy aliases', () => {
    expect(legacyDeptToCode('HUMAN RESOURCES')).toBe('HRES');
    expect(legacyDeptToCode('human resources')).toBe('HRES');
  });
});

describe('legacyDeptToCode — all canonical department names round-trip', () => {
  const cases: [string, string][] = [
    ['Engineering', 'ENGR'],
    ['Product',     'PROD'],
    ['Design',      'DSGN'],
    ['Marketing',   'MKTG'],
    ['Sales',       'SALE'],
    ['Operations',  'OPER'],
    ['Finance',     'FINC'],
    ['HR',          'HRES'],
    ['Legal',       'LEGL'],
  ];

  for (const [name, code] of cases) {
    it(`"${name}" → ${code}`, () => {
      expect(legacyDeptToCode(name)).toBe(code);
    });
  }
});

describe('legacyDeptToCode — KB Doc 3: IT alias', () => {
  it('"IT" maps to ENGR (not a valid standalone dept)', () => {
    expect(legacyDeptToCode('IT')).toBe('ENGR');
  });
});

// ── isValidDeptCode ───────────────────────────────────────────────────────────

describe('isValidDeptCode', () => {
  it('accepts all ALLOWED_DEPT_CODES', () => {
    for (const code of ALLOWED_DEPT_CODES) {
      expect(isValidDeptCode(code)).toBe(true);
    }
  });

  it('rejects unknown codes', () => {
    expect(isValidDeptCode('ENG')).toBe(false);   // old placeholder code
    expect(isValidDeptCode('HR')).toBe(false);    // old placeholder code
    expect(isValidDeptCode('')).toBe(false);
    expect(isValidDeptCode('BOGUS')).toBe(false);
  });
});

// ── getDeptName ───────────────────────────────────────────────────────────────

describe('getDeptName', () => {
  it('returns the canonical name for each code', () => {
    expect(getDeptName('ENGR')).toBe('Engineering');
    expect(getDeptName('HRES')).toBe('HR');
    expect(getDeptName('LEGL')).toBe('Legal');
  });

  it('returns undefined for unknown codes', () => {
    expect(getDeptName('ENG')).toBeUndefined();
    expect(getDeptName('')).toBeUndefined();
  });
});

// ── DEPT_CODE_TO_NAME completeness ───────────────────────────────────────────

describe('DEPT_CODE_TO_NAME', () => {
  it('contains exactly 9 entries (one per KB Doc 3 department)', () => {
    expect(Object.keys(DEPT_CODE_TO_NAME)).toHaveLength(9);
  });

  it('ALLOWED_DEPT_CODES matches the mapping keys', () => {
    expect(ALLOWED_DEPT_CODES).toEqual(Object.keys(DEPT_CODE_TO_NAME));
  });
});

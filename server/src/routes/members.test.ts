// server/src/routes/members.test.ts
// Route-level tests for POST /api/members — verifies the 400 { error, allowed }
// contract on bad dept_code and 201 on a valid create. The db module is mocked so
// these tests run without a real SQLite file.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── db mock ───────────────────────────────────────────────────────────────────

// vi.hoisted ensures these variables exist when the vi.mock factory below runs
// (vi.mock is hoisted to the top of the module before imports are evaluated).
const { mockRun, mockGet, mockMemberRow } = vi.hoisted(() => {
  const mockMemberRow = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'Engineer',
    department: 'Engineering',
    dept_code: 'ENGR',
    start_date: '2024-01-01',
    is_active: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
  const mockRun = vi.fn();
  const mockGet = vi.fn<() => typeof mockMemberRow>(() => mockMemberRow);
  return { mockRun, mockGet, mockMemberRow };
});

vi.mock('../db.js', () => ({
  getDb: vi.fn(() => ({
    prepare: vi.fn(() => ({
      run: mockRun,
      get: mockGet,
      all: vi.fn(() => []),
    })),
  })),
}));

// Import the router AFTER the mock is in place.
import membersRouter from './members.js';

// ── test app ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/', membersRouter);

// ── helpers ───────────────────────────────────────────────────────────────────

const validPayload = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'Engineer',
  dept_code: 'ENGR',
  start_date: '2024-01-01',
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/members — dept_code validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(mockMemberRow);
  });

  it('returns 400 with { error, allowed } for a bogus dept_code', async () => {
    const res = await request(app)
      .post('/')
      .send({ ...validPayload, dept_code: 'BOGUS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid dept_code/);
    expect(Array.isArray(res.body.allowed)).toBe(true);
    // Confirmed People Ops codes must appear in the allowed list.
    expect(res.body.allowed).toContain('ENGR');
    expect(res.body.allowed).toContain('HRES');
    expect(res.body.allowed).toContain('LEGL');
    // Old placeholder codes must NOT appear.
    expect(res.body.allowed).not.toContain('ENG');
    expect(res.body.allowed).not.toContain('HR');
    expect(res.body.allowed).not.toContain('LEGAL');
  });

  it('returns 400 with { error, allowed } for a stale placeholder code (ENG)', async () => {
    const res = await request(app)
      .post('/')
      .send({ ...validPayload, dept_code: 'ENG' });

    expect(res.status).toBe(400);
    expect(res.body.allowed).not.toContain('ENG');
    expect(res.body.allowed).toContain('ENGR');
  });

  it('returns 201 with dept_name for a valid dept_code (ENGR)', async () => {
    const res = await request(app)
      .post('/')
      .send({ ...validPayload, dept_code: 'ENGR' });

    expect(res.status).toBe(201);
    expect(res.body.dept_code).toBe('ENGR');
    expect(res.body.dept_name).toBe('Engineering');
  });

  it('returns 201 with dept_name for a valid dept_code (HRES)', async () => {
    mockGet.mockReturnValue({
      ...mockMemberRow,
      dept_code: 'HRES',
      department: 'HR',
      email: 'hr@example.com',
    });

    const res = await request(app)
      .post('/')
      .send({ ...validPayload, email: 'hr@example.com', dept_code: 'HRES' });

    expect(res.status).toBe(201);
    expect(res.body.dept_code).toBe('HRES');
    expect(res.body.dept_name).toBe('HR');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/')
      .send({ name: 'Missing Fields' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  it('returns 409 on duplicate email', async () => {
    mockRun.mockImplementation(() => {
      throw new Error('UNIQUE constraint failed: members.email');
    });

    const res = await request(app)
      .post('/')
      .send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });
});

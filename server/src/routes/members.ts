// server/src/routes/members.ts — member CRUD endpoints (TeamBoard)
import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import {
  ALLOWED_DEPT_CODES,
  isValidDeptCode,
  getDeptName,
} from '../departments.js';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  dept_code: string;
  start_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/** Attaches the resolved dept_name to a MemberRow for API responses. */
function withDeptName(row: MemberRow): MemberRow & { dept_name: string | null } {
  return { ...row, dept_name: getDeptName(row.dept_code) ?? null };
}

const router: Router = Router();

// --- Read handlers -----------------------------------------------------------

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM members WHERE is_active = 1 ORDER BY name ASC'
  ).all() as unknown as MemberRow[];
  res.json({ members: rows.map(withDeptName) });
});

router.get('/export', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM members ORDER BY name ASC').all() as unknown as MemberRow[];
  const header = 'id,name,email,role,dept_code,start_date,is_active';
  const csv = [header, ...rows.map(r =>
    `${r.id},${r.name},${r.email},${r.role},${r.dept_code},${r.start_date},${r.is_active}`
  )].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
  res.send(csv);
});

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb();
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM members WHERE is_active = 1'
  ).get() as unknown as { count: number };
  const byDept = db.prepare(
    'SELECT dept_code, COUNT(*) as count FROM members WHERE is_active = 1 GROUP BY dept_code ORDER BY count DESC'
  ).all() as unknown as { dept_code: string; count: number }[];
  res.json({
    total: total.count,
    byDepartment: byDept.map(r => ({
      dept_code: r.dept_code,
      dept_name: getDeptName(r.dept_code) ?? null,
      count: r.count,
    })),
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ?'
  ).get(Number(req.params.id)) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(withDeptName(member));
});

// --- Write handlers ----------------------------------------------------------

router.post('/', (req: Request, res: Response): void => {
  const { name, email, role, dept_code, start_date } = req.body;
  if (!name || !email || !role || !dept_code || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, dept_code, start_date' });
    return;
  }
  if (!isValidDeptCode(dept_code)) {
    res.status(400).json({
      error: `Invalid dept_code; allowed codes: ${ALLOWED_DEPT_CODES.join(', ')}`,
      allowed: ALLOWED_DEPT_CODES,
    });
    return;
  }
  const department = getDeptName(dept_code);
  if (!department) {
    res.status(500).json({ error: 'dept_code resolved to unknown name' });
    return;
  }
  const db = getDb();
  try {
    db.prepare(
      'INSERT INTO members (name, email, role, department, dept_code, start_date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, role, department, dept_code, start_date);
    const member = db.prepare('SELECT * FROM members WHERE email = ?').get(email) as unknown as MemberRow;
    res.status(201).json(withDeptName(member));
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'A member with this email already exists' });
      return;
    }
    throw err;
  }
});

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ?'
  ).get(Number(req.params.id)) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  // dept_code is accepted; any incoming `department` field is intentionally ignored
  const { name, email, role, dept_code } = req.body;
  if (dept_code !== undefined && !isValidDeptCode(dept_code)) {
    res.status(400).json({
      error: `Invalid dept_code; allowed codes: ${ALLOWED_DEPT_CODES.join(', ')}`,
      allowed: ALLOWED_DEPT_CODES,
    });
    return;
  }
  // Resolve canonical department name only when a new code is supplied
  let department: string | undefined;
  if (dept_code !== undefined) {
    department = getDeptName(dept_code);
    if (!department) {
      res.status(500).json({ error: 'dept_code resolved to unknown name' });
      return;
    }
  }
  db.prepare(
    `UPDATE members SET
      name       = COALESCE(?, name),
      email      = COALESCE(?, email),
      role       = COALESCE(?, role),
      dept_code  = COALESCE(?, dept_code),
      department = COALESCE(?, department),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    name       ?? null,
    email      ?? null,
    role       ?? null,
    dept_code  ?? null,
    department ?? null,
    member.id,
  );
  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(member.id) as unknown as MemberRow;
  res.json(withDeptName(updated));
});

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ?'
  ).get(Number(req.params.id)) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  db.prepare('DELETE FROM members WHERE id = ?').run(member.id);
  res.json({ success: true });
});

export default router;

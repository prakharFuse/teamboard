import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\r') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM members WHERE is_active = 1 ORDER BY name ASC'
  ).all() as unknown as MemberRow[];
  res.json({ members: rows });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, email, role, department, start_date } = req.body;
  if (!name || !email || !role || !department || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, department, start_date' });
    return;
  }
  const db = getDb();
  try {
    db.prepare(
      'INSERT INTO members (name, email, role, department, start_date) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, role, department, start_date);
    const member = db.prepare('SELECT * FROM members WHERE email = ?').get(email) as unknown as MemberRow;
    res.status(201).json(member);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'A member with this email already exists' });
      return;
    }
    throw err;
  }
});

router.get('/export', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM members ORDER BY name ASC').all() as unknown as MemberRow[];
  const header = 'id,name,email,role,department,start_date,is_active';
  const csv = [header, ...rows.map(r =>
    [r.id, r.name, r.email, r.role, r.department, r.start_date, r.is_active]
      .map(escapeCsvField)
      .join(',')
  )].join('\r\n');
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
    'SELECT department, COUNT(*) as count FROM members WHERE is_active = 1 GROUP BY department ORDER BY count DESC'
  ).all() as unknown as { department: string; count: number }[];
  res.json({ total: total.count, byDepartment: byDept });
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
  res.json(member);
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
  const { name, email, role, department } = req.body;
  db.prepare(
    `UPDATE members SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      department = COALESCE(?, department),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(name ?? null, email ?? null, role ?? null, department ?? null, member.id);
  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(member.id) as unknown as MemberRow;
  res.json(updated);
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

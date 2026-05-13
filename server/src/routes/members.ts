import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { writeAuditLog } from '../audit.js';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  workspace_id: number;
  created_at: string;
  updated_at: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? ORDER BY name ASC'
  ).all(req.workspace!.id) as unknown as MemberRow[];
  res.json({ members: rows });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, email, role, department, start_date } = req.body;
  if (!name || !email || !role || !department || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, department, start_date' });
    return;
  }

  // Validate department against workspace-specific dept code list (skip when list is empty)
  const deptList: string[] = JSON.parse(req.workspace!.bamboohr_dept_code_list);
  if (deptList.length > 0 && !deptList.includes(department)) {
    res.status(400).json({ error: 'Invalid department code' });
    return;
  }

  const db = getDb();
  try {
    db.prepare(
      'INSERT INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, role, department, start_date, req.workspace!.id);
    const member = db.prepare(
      'SELECT * FROM members WHERE email = ? AND workspace_id = ?'
    ).get(email, req.workspace!.id) as unknown as MemberRow;
    writeAuditLog(db, req.user?.email ?? 'anonymous', req.workspace!.id, 'member_create', member.id);
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

  // Resolve workspace: ?workspace= query param takes precedence over header-resolved workspace
  let workspaceId: number = req.workspace!.id;
  if (req.query.workspace) {
    const wsSlug = String(req.query.workspace);
    const ws = db.prepare(
      'SELECT * FROM workspaces WHERE slug = ?'
    ).get(wsSlug) as unknown as { id: number } | undefined;
    if (!ws) {
      res.status(400).json({ error: 'Unknown workspace' });
      return;
    }
    workspaceId = ws.id;
  }

  const rows = db.prepare(
    'SELECT * FROM members WHERE workspace_id = ? ORDER BY name ASC'
  ).all(workspaceId) as unknown as MemberRow[];

  writeAuditLog(db, req.user?.email ?? 'anonymous', workspaceId, 'export_download', null);

  // Preserve exact CSV column order — do not add workspace_id (TM-101 column stability)
  const header = 'id,name,email,role,department,start_date,is_active';
  const csv = [header, ...rows.map(r =>
    `${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
  )].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
  res.send(csv);
});

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb();
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ?'
  ).get(req.workspace!.id) as unknown as { count: number };
  const byDept = db.prepare(
    'SELECT department, COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ? GROUP BY department ORDER BY count DESC'
  ).all(req.workspace!.id) as unknown as { department: string; count: number }[];
  res.json({ total: total.count, byDepartment: byDept });
});

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace!.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace!.id) as unknown as MemberRow | undefined;
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
  writeAuditLog(db, req.user?.email ?? 'anonymous', req.workspace!.id, 'member_update', member.id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace!.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  // Soft-delete: deactivate and prefix email (TM-101), only if not already prefixed
  const deactivatedEmail = member.email.startsWith('deactivated-')
    ? member.email
    : `deactivated-${member.email}`;
  db.prepare(
    `UPDATE members SET is_active = 0, email = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(deactivatedEmail, member.id);
  writeAuditLog(db, req.user?.email ?? 'anonymous', req.workspace!.id, 'member_delete', member.id);
  res.json({ success: true });
});

export default router;

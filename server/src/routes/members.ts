import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { WorkspaceRow } from '../middleware/workspace.js';
import { writeAuditLog } from '../middleware/audit.js';

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
  const { department } = req.query;
  const workspaceId = req.workspace.id;

  let rows: MemberRow[];
  if (department && typeof department === 'string') {
    rows = db.prepare(
      'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? AND department = ? ORDER BY name ASC'
    ).all(workspaceId, department) as unknown as MemberRow[];
  } else {
    rows = db.prepare(
      'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? ORDER BY name ASC'
    ).all(workspaceId) as unknown as MemberRow[];
  }

  res.json({ members: rows });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, email, role, department, start_date } = req.body;
  if (!name || !email || !role || !department || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, department, start_date' });
    return;
  }

  // Validate department against workspace's bamboohr_dept_code_list (skip if null/empty)
  const deptCodeList = req.workspace.bamboohr_dept_code_list;
  if (deptCodeList) {
    try {
      const validDepts = JSON.parse(deptCodeList) as unknown;
      if (Array.isArray(validDepts) && validDepts.length > 0 && !(validDepts as string[]).includes(department)) {
        res.status(400).json({ error: `Invalid department. Must be one of: ${(validDepts as string[]).join(', ')}` });
        return;
      }
    } catch {
      // Malformed JSON — skip validation
    }
  }

  const db = getDb();
  const actorEmail = req.user?.email ?? 'system';

  try {
    db.prepare(
      'INSERT INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, role, department, start_date, req.workspace.id);
    const member = db.prepare(
      'SELECT * FROM members WHERE email = ? AND workspace_id = ?'
    ).get(email, req.workspace.id) as unknown as MemberRow;
    writeAuditLog(db, { actorEmail, workspaceId: req.workspace.id, action: 'member.create', entityId: member.id });
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
  const actorEmail = req.user?.email ?? 'system';

  // Support ?workspace=X override
  let workspaceId = req.workspace.id;
  if (req.query.workspace && typeof req.query.workspace === 'string') {
    const override = db.prepare(
      'SELECT * FROM workspaces WHERE slug = ?'
    ).get(req.query.workspace) as WorkspaceRow | undefined;
    if (override) {
      workspaceId = override.id;
    }
  }

  const rows = db.prepare(
    'SELECT * FROM members WHERE workspace_id = ? ORDER BY name ASC'
  ).all(workspaceId) as unknown as MemberRow[];

  const header = 'id,name,email,role,department,start_date,is_active';
  const csv = [header, ...rows.map(r =>
    `${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
  )].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');

  writeAuditLog(db, { actorEmail, workspaceId, action: 'member.export', entityId: null });
  res.send(csv);
});

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb();
  const workspaceId = req.workspace.id;
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ?'
  ).get(workspaceId) as unknown as { count: number };
  const byDept = db.prepare(
    'SELECT department, COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ? GROUP BY department ORDER BY count DESC'
  ).all(workspaceId) as unknown as { department: string; count: number }[];
  res.json({ total: total.count, byDepartment: byDept });
});

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const actorEmail = req.user?.email ?? 'system';
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
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
    WHERE id = ? AND workspace_id = ?`
  ).run(name ?? null, email ?? null, role ?? null, department ?? null, member.id, req.workspace.id);
  const updated = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(member.id, req.workspace.id) as unknown as MemberRow;
  writeAuditLog(db, { actorEmail, workspaceId: req.workspace.id, action: 'member.update', entityId: member.id });
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const actorEmail = req.user?.email ?? 'system';
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  db.prepare(
    `UPDATE members SET
      is_active = 0,
      email = CASE
        WHEN email NOT LIKE 'deactivated-%' THEN 'deactivated-' || email
        ELSE email
      END,
      updated_at = datetime('now')
    WHERE id = ? AND workspace_id = ?`
  ).run(member.id, req.workspace.id);
  writeAuditLog(db, { actorEmail, workspaceId: req.workspace.id, action: 'member.delete', entityId: member.id });
  res.json({ success: true });
});

export default router;

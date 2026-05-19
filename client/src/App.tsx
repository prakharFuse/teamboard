// client/src/App.tsx — single-component UI with all state and fetch logic (TeamBoard)
import { useState, useEffect } from 'react';

const ALLOWED_DEPARTMENTS = [
  { code: 'ENG',   name: 'Engineering' },
  { code: 'PROD',  name: 'Product' },
  { code: 'DES',   name: 'Design' },
  { code: 'MKT',   name: 'Marketing' },
  { code: 'SALES', name: 'Sales' },
  { code: 'OPS',   name: 'Operations' },
  { code: 'FIN',   name: 'Finance' },
  { code: 'HR',    name: 'HR' },
  { code: 'LEGAL', name: 'Legal' },
];

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  dept_code: string;
  dept_name: string | null;
  start_date: string;
  is_active: number;
}

interface Stats {
  total: number;
  byDepartment: { dept_code: string; dept_name: string | null; count: number }[];
}

function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [departments, setDepartments] = useState<{ code: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const [errorAllowed, setErrorAllowed] = useState<string[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadMembers(): Promise<void> {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data.members);
  }

  async function loadStats(): Promise<void> {
    const res = await fetch('/api/members/stats');
    const data = await res.json();
    setStats(data);
  }

  async function loadDepartments(): Promise<void> {
    const res = await fetch('/api/departments');
    const data = await res.json();
    setDepartments(data.departments);
  }

  useEffect(() => {
    loadMembers();
    loadStats();
    loadDepartments();
  }, []);

  async function addMember(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setErrorAllowed(null);
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, dept_code: deptCode, start_date: startDate }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to add member');
      if (data.allowed) setErrorAllowed(data.allowed);
      return;
    }
    setName('');
    setEmail('');
    setRole('');
    setDeptCode('');
    setStartDate('');
    setShowForm(false);
    loadMembers();
    loadStats();
  }

  async function removeMember(id: number): Promise<void> {
    if (!confirm('Remove this team member?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    loadMembers();
    loadStats();
  }

  return (
    <div className="app">
      <header>
        <h1>TeamBoard</h1>
        <p className="subtitle">Internal Team Directory</p>
      </header>

      <div className="layout">
        <main>
          <div className="toolbar">
            <h2>Team Members ({members.length})</h2>
            <button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Member'}
            </button>
          </div>

          {showForm && (
            <form className="add-form" onSubmit={addMember}>
              {error && (
                <div className="error">
                  {error}
                  {errorAllowed && (
                    <span> Allowed codes: {errorAllowed.join(', ')}</span>
                  )}
                </div>
              )}
              <div className="form-row">
                <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-row">
                <input placeholder="Role / title" value={role} onChange={e => setRole(e.target.value)} required />
                <select value={deptCode} onChange={e => setDeptCode(e.target.value)} required>
                  <option value="">Select department…</option>
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                  ))}
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <button type="submit">Add Member</button>
            </form>
          )}

          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Start Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td className="name-cell">{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td><span className="dept-badge">{m.dept_name ?? m.dept_code}</span></td>
                  <td>{m.start_date}</td>
                  <td>
                    <button className="remove-btn" onClick={() => removeMember(m.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        <aside>
          <h3>Department Stats</h3>
          {stats && (
            <>
              <div className="stat-total">{stats.total} active</div>
              <ul className="dept-list">
                {stats.byDepartment.map(d => (
                  <li key={d.dept_code}>
                    <span>{d.dept_name ?? d.dept_code}</span>
                    <span className="count">{d.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <a href="/api/members/export" className="export-link">Download CSV for HR</a>
        </aside>
      </div>
    </div>
  );
}

export default App;

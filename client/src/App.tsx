import { useState, useEffect } from 'react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
}

interface Stats {
  total: number;
  byDepartment: { department: string; count: number }[];
}

const DEPARTMENT_CODES = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Legal'] as const;

function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
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

  useEffect(() => {
    loadMembers();
    loadStats();
  }, []);

  async function addMember(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, department, start_date: startDate }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to add member');
      return;
    }
    setName('');
    setEmail('');
    setRole('');
    setDepartment('');
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
              {error && <div className="error">{error}</div>}
              <div className="form-row">
                <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
                <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-row">
                <input placeholder="Role / title" value={role} onChange={e => setRole(e.target.value)} required />
                <select value={department} onChange={e => setDepartment(e.target.value)} required>
                  <option value="" disabled>Department</option>
                  {DEPARTMENT_CODES.map(d => (
                    <option key={d} value={d}>{d}</option>
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
                  <td><span className="dept-badge">{m.department}</span></td>
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
                  <li key={d.department}>
                    <span>{d.department}</span>
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

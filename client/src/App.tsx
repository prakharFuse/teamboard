import { useState, useEffect, useRef } from 'react';

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

interface Workspace {
  id: number;
  slug: string;
  name: string;
}

interface FeatureFlags {
  workspaceSwitcher: boolean;
}

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({ workspaceSwitcher: false });
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);

  const activeWorkspaceRef = useRef<Workspace | null>(null);

  // Keep activeWorkspaceRef in sync with activeWorkspace
  useEffect(() => {
    activeWorkspaceRef.current = activeWorkspace;
  }, [activeWorkspace]);

  function buildHeaders(): { 'Content-Type': string; 'X-Workspace-Id': string } {
    return {
      'Content-Type': 'application/json',
      'X-Workspace-Id': activeWorkspace?.slug ?? 'parent-co',
    };
  }

  async function loadMembers(): Promise<void> {
    const slug = activeWorkspace?.slug ?? 'parent-co';
    const res = await fetch('/api/members', { headers: buildHeaders() });
    if ((activeWorkspaceRef.current?.slug ?? 'parent-co') !== slug) return;
    const data = await res.json();
    setMembers(data.members);
  }

  async function loadStats(): Promise<void> {
    const slug = activeWorkspace?.slug ?? 'parent-co';
    const res = await fetch('/api/members/stats', { headers: buildHeaders() });
    if ((activeWorkspaceRef.current?.slug ?? 'parent-co') !== slug) return;
    const data = await res.json();
    setStats(data);
  }

  async function loadDepartments(): Promise<void> {
    const res = await fetch('/api/departments', {
      headers: { 'X-Workspace-Id': activeWorkspace?.slug ?? 'parent-co' },
    });
    const data = await res.json();
    setDepartments(data.departments);
  }

  // On mount: load feature flags, workspaces, and initial departments
  useEffect(() => {
    async function init() {
      const [configRes, workspacesRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/workspaces'),
      ]);
      const configData = await configRes.json();
      setFeatureFlags(configData.featureFlags);

      const workspacesData = await workspacesRes.json();
      const ws: Workspace[] = workspacesData.workspaces ?? [];
      setWorkspaces(ws);
      if (ws.length > 0) {
        setActiveWorkspace(ws[0]);
      }
      setWorkspacesLoaded(true);
      loadDepartments();
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload members, stats, and departments whenever the active workspace changes
  useEffect(() => {
    loadMembers();
    loadStats();
    loadDepartments();
  }, [activeWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addMember(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: buildHeaders(),
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
    await fetch(`/api/members/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    loadMembers();
    loadStats();
  }

  return (
    <div className="app">
      <header>
        <h1>TeamBoard</h1>
        {featureFlags.workspaceSwitcher && workspaces.length > 1 && (
          <select
            className="workspace-switcher"
            value={activeWorkspace?.slug ?? ''}
            onChange={e => {
              const ws = workspaces.find(w => w.slug === e.target.value);
              if (ws) setActiveWorkspace(ws);
            }}
          >
            {workspaces.map(ws => (
              <option key={ws.slug} value={ws.slug}>{ws.name}</option>
            ))}
          </select>
        )}
        <p className="subtitle">Internal Team Directory</p>
      </header>

      <div className="layout">
        {workspacesLoaded && workspaces.length === 0 ? (
          <p>Contact your admin to request workspace access.</p>
        ) : (
          <>
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
                      <option value="">Select department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
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
              <a
                href={`/api/members/export?workspace=${activeWorkspace?.slug ?? 'parent-co'}`}
                className="export-link"
              >
                Download CSV for HR
              </a>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

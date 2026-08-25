import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const load = async () => {
    const [statsRes, usersRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]);
    setStats(statsRes.data);
    setUsers(usersRes.data);
  };

  useEffect(() => { load(); }, []);

  const toggleBan = async (id) => {
    await api.put(`/admin/users/${id}/ban`);
    load();
  };

  if (!stats) return <div className="container"><p>Loading admin data...</p></div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>Admin Dashboard</h2>

      <div className="grid" style={{ marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{stats.totalUsers}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Total Users</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{stats.totalListings}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Skill Listings</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{stats.totalCompletedSwaps}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Completed Swaps</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Top Skill Categories</h3>
        {stats.topCategories.map((c) => (
          <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{c._id}</span><span>{c.count}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Users</h3>
        {users.map((u) => (
          <div key={u._id} className="history-item">
            <div>
              <strong>{u.name}</strong> <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>({u.email})</span>
              {u.isBanned && <span className="badge badge-declined" style={{ marginLeft: 8 }}>Banned</span>}
            </div>
            <button className={`btn btn-sm ${u.isBanned ? '' : 'btn-danger'}`} onClick={() => toggleBan(u._id)}>
              {u.isBanned ? 'Unban' : 'Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

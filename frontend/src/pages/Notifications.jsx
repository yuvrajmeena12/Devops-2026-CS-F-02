import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Notifications</h2>
        <button className="btn btn-sm btn-outline" onClick={markAllRead}>Mark all as read</button>
      </div>
      <div className="card">
        {notifications.length === 0 && <p style={{ color: 'var(--ink-muted)' }}>No notifications yet.</p>}
        {notifications.map((n) => (
          <div key={n._id} className="history-item">
            <div>
              <p style={{ fontWeight: n.isRead ? 400 : 700 }}>{n.message}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

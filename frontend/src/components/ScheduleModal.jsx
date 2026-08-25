import { useState } from 'react';
import api from '../api/axios';

export default function ScheduleModal({ swap, onClose }) {
  const [dateTime, setDateTime] = useState('');
  const [mode, setMode] = useState('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!dateTime) { setError('Pick a date & time'); return; }
    try {
      await api.post('/sessions', {
        swapRequestId: swap._id,
        scheduledDateTime: dateTime,
        mode,
        meetingLink,
        address,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="card" style={{ maxWidth: 420, width: '90%' }}>
        {done ? (
          <>
            <h3>Session Proposed!</h3>
            <p style={{ color: 'var(--ink-muted)', margin: '10px 0' }}>The other user will need to confirm this time.</p>
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: 10 }}>Schedule Session</h3>
            {error && <p className="error-text">{error}</p>}
            <label>Date & Time</label>
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
            <label>Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="online">Online</option>
              <option value="in-person">In-person</option>
            </select>
            {mode === 'online' ? (
              <>
                <label>Meeting link (Zoom/Meet URL)</label>
                <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </>
            ) : (
              <>
                <label>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Meeting location" />
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn" onClick={handleSubmit}>Propose Schedule</button>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

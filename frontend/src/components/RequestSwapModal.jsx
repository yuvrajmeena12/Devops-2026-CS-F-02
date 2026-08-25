import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function RequestSwapModal({ skill, onClose }) {
  const [mySkills, setMySkills] = useState([]);
  const [offeredSkill, setOfferedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get('/skills/mine').then(({ data }) => {
      setMySkills(data.filter((s) => s.type === 'teach'));
    });
  }, []);

  const handleSend = async () => {
    setError('');
    if (!offeredSkill) {
      setError('Select which of your skills you are offering in exchange');
      return;
    }
    try {
      await api.post('/swaps', {
        toUser: skill.user._id,
        offeredSkill,
        requestedSkill: skill._id,
        message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div className="card" style={{ maxWidth: 420, width: '90%' }}>
        {sent ? (
          <>
            <h3 style={{ marginBottom: 10 }}>Request Sent!</h3>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>
              Your swap request for "{skill.title}" has been sent to {skill.user.name}.
            </p>
            <button className="btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: 10 }}>Request Swap: {skill.title}</h3>
            {error && <p className="error-text">{error}</p>}
            <label>Which of your skills are you offering in exchange?</label>
            <select value={offeredSkill} onChange={(e) => setOfferedSkill(e.target.value)}>
              <option value="">Select a skill you can teach</option>
              {mySkills.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
            </select>
            <label>Message (optional)</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn" onClick={handleSend}>Send Request</button>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

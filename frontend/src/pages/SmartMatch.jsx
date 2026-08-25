import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function SmartMatch() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/skills/matches').then(({ data }) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const viewCertificate = async (skillId) => {
    try {
      const { data } = await api.get(`/skills/${skillId}/certificate`);
      const w = window.open();
      w.document.write(`<iframe src="${data.certificateFile}" style="width:100%;height:100%;border:none;" title="certificate"></iframe>`);
    } catch (err) {
      alert('Could not load the certificate.');
    }
  };

  if (loading) return <div className="container"><p style={{ color: 'var(--ink-muted)' }}>Finding matches...</p></div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>Your Matches</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 20 }}>
        People who teach something you want to learn — mutual matches teach and learn from each other.
      </p>

      {matches.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>No matches yet.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Add a skill under "I Want to Learn" on My Skills to start seeing matches here.</p>
          <Link to="/my-skills" className="btn btn-sm" style={{ marginTop: 14, display: 'inline-block' }}>Add a skill</Link>
        </div>
      )}

      <div className="grid">
        {matches.map((m) => (
          <div key={m.user._id} className="ticket">
            {m.mutualMatch && <div className="ticket-eyebrow" style={{ color: 'var(--teal-dark)' }}>✓ Mutual match</div>}
            <div className="ticket-title">{m.user.name}</div>
            <div className="ticket-meta">{m.user.location} {m.user.trustScore ? `· ★ ${m.user.trustScore}` : '· No ratings yet'}</div>
            <div className="ticket-divider" />

            <p style={{ fontSize: 13, marginBottom: 6 }}><strong>They teach:</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {(m.theyTeachSkills || []).map((s) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span>{s.title}</span>
                  {s.isVerified && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--teal)', color: 'var(--paper)', padding: '2px 7px', borderRadius: 10 }}>
                      ✓ VERIFIED
                    </span>
                  )}
                  {s.isVerified && (
                    <button
                      onClick={() => viewCertificate(s._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--teal-dark)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      View Certificate
                    </button>
                  )}
                </div>
              ))}
            </div>

            {m.mutualMatch && <p style={{ fontSize: 13 }}><strong>You teach:</strong> {m.iTeachThem.join(', ')}</p>}
            <div className="ticket-row" style={{ marginTop: 10 }}>
              <span></span>
              <Link to={`/profile/${m.user._id}`} className="btn btn-sm">View profile</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

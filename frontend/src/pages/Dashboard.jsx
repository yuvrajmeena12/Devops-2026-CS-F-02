import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, incoming: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const [hasSkills, setHasSkills] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [active, incoming, matches, mySkills] = await Promise.all([
          api.get('/swaps/active'),
          api.get('/swaps/incoming'),
          api.get('/skills/matches'),
          api.get('/skills/mine'),
        ]);
        setStats({
          active: active.data.length,
          incoming: incoming.data.filter((s) => s.status === 'pending').length,
          matches: matches.data.length,
        });
        setHasSkills(mySkills.data.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>Welcome back, {user?.name}</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 24 }}>Here's where things stand.</p>

      {!loading && !hasSkills && (
        <div className="card" style={{ borderLeft: '3px solid var(--amber)' }}>
          <strong>Add your first skill to get matched</strong>
          <p style={{ color: 'var(--ink-muted)', fontSize: 13, margin: '6px 0 12px' }}>
            You need at least one skill you can teach and one you want to learn before we can find you a match.
          </p>
          <Link to="/my-skills" className="btn btn-sm">Add a skill</Link>
        </div>
      )}

      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>{loading ? '—' : stats.active}</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Swaps in progress</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>{loading ? '—' : stats.incoming}</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Requests waiting on you</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700 }}>{loading ? '—' : stats.matches}</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Suggested matches</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Quick actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/matches" className="btn">Find a match</Link>
          <Link to="/my-swaps" className="btn btn-outline">View my swaps</Link>
          <Link to="/explore" className="btn btn-outline">Browse all skills</Link>
        </div>
      </div>
    </div>
  );
}

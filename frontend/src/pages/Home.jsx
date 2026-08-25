import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="container">
      <div style={{ padding: '56px 0 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>
          No money changes hands
        </div>
        <h1 style={{ fontSize: 44, lineHeight: 1.15, marginBottom: 18 }}>
          Trade what you know<br />for what you want to learn
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px' }}>
          List a skill you can teach, find someone who wants it and teaches
          what you want back — then swap.
        </p>
        <Link to={user ? '/matches' : '/register'} className="btn" style={{ padding: '13px 28px', fontSize: 15 }}>
          {user ? 'Find a match' : 'Get started — it\'s free'}
        </Link>
      </div>

      {/* Signature element preview: a sample "trade ticket" pair showing the exchange concept */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
        <div className="ticket" style={{ width: 230 }}>
          <div className="ticket-eyebrow">💻 Tech · Intermediate</div>
          <div className="ticket-title">React Basics</div>
          <div className="ticket-divider" />
          <div style={{ fontSize: 12, color: 'var(--paper-muted)' }}>Priya offers this</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: 'var(--amber)' }}>⇄</div>
        <div className="ticket" style={{ width: 230 }}>
          <div className="ticket-eyebrow">🗣️ Language · Beginner</div>
          <div className="ticket-title">Conversational Spanish</div>
          <div className="ticket-divider" />
          <div style={{ fontSize: 12, color: 'var(--paper-muted)' }}>You offer this back</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 18 }}>How a swap works</h3>
        <div className="stepper" style={{ margin: '0' }}>
          {['Requested', 'Accepted', 'Scheduled', 'Confirmed', 'Completed', 'Reviewed'].map((label, i) => (
            <div key={label} className={`step ${i === 0 ? 'current' : ''}`}>
              <div className="step-line" />
              <div className="step-dot">{i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 16 }}>
          Every swap moves through these six steps in order, and you'll always see exactly
          where a swap stands and what to do next.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>📅</div>
          <h4 style={{ marginBottom: 6, fontSize: 16 }}>Scheduling</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Propose a session time, online or in person. Both sides confirm before it's locked in.
          </p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>⭐</div>
          <h4 style={{ marginBottom: 6, fontSize: 16 }}>Ratings</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Rate each other after a swap. Ratings build a public trust score on every profile.
          </p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26, marginBottom: 8 }}>✅</div>
          <h4 style={{ marginBottom: 6, fontSize: 16 }}>Verified Skills</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            Attach a certificate or portfolio link to a skill you teach to earn a Verified badge.
          </p>
        </div>
      </div>
    </div>
  );
}

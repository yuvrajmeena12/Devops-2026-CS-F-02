import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      // Only present when the backend has no email service configured —
      // lets the flow still be fully testable during development/evaluation.
      if (data.devResetLink) setDevLink(data.devResetLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4, fontSize: 22 }}>Reset your password</h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 18 }}>
          Enter the email on your account and we'll send you a reset link.
        </p>

        {error && <p className="error-text">{error}</p>}

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div>
            <div className="card" style={{ borderLeft: '3px solid var(--teal)' }}>
              <p style={{ fontSize: 14 }}>
                If that email is registered, a reset link has been sent. Check your inbox (and spam folder).
              </p>
            </div>

            {devLink && (
              <div className="card" style={{ borderLeft: '3px solid var(--amber)', marginTop: 14 }}>
                <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
                  Email sending isn't configured on this deployment yet, so here's your reset link directly
                  (this box only appears because no email service is set up \u2014 remove this in production):
                </p>
                <Link to={devLink.replace(window.location.origin, '')} style={{ fontSize: 13, color: 'var(--amber)', wordBreak: 'break-all' }}>
                  {devLink}
                </Link>
              </div>
            )}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-muted)' }}>
          <Link to="/login" style={{ color: 'var(--amber)' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
}

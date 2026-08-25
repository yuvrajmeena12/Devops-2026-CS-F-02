import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4, fontSize: 22 }}>Set a new password</h2>

        {success ? (
          <div className="card" style={{ borderLeft: '3px solid var(--teal)', marginTop: 12 }}>
            <p style={{ fontSize: 14 }}>Password reset! Taking you to login...</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 18 }}>
              Choose a new password for your account.
            </p>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleSubmit}>
              <label>New password (min 6 characters)</label>
              <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <label>Confirm new password</label>
              <input type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button className="btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-muted)' }}>
              <Link to="/login" style={{ color: 'var(--amber)' }}>Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

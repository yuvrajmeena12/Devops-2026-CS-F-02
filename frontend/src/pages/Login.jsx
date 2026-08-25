import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4, fontSize: 22 }}>Welcome back</h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 18 }}>Log in to continue swapping skills.</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--ink-muted)', fontSize: 12.5 }}>Forgot password?</Link>
          </p>
          <button className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Logging you in..." : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-muted)' }}>
          No account? <Link to="/register" style={{ color: 'var(--amber)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

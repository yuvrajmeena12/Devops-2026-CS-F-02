import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '', bio: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) {
      setError('Please agree to the Terms & Conditions to continue');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4, fontSize: 22 }}>Create your account</h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 18 }}>Takes less than a minute.</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input value={form.name} onChange={update('name')} required />
          <label>Email</label>
          <input type="email" value={form.email} onChange={update('email')} required />
          <label>Password (min 6 characters)</label>
          <input type="password" minLength={6} value={form.password} onChange={update('password')} required />
          <label>Location (city)</label>
          <input value={form.location} onChange={update('location')} placeholder="e.g. Jodhpur" />
          <label>Short bio</label>
          <textarea rows={3} value={form.bio} onChange={update('bio')} placeholder="Tell others a bit about yourself" />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 'auto', marginBottom: 0, marginTop: 2 }}
            />
            <span style={{ fontSize: 13, color: 'var(--ink-text)' }}>
              I agree to the <Link to="/terms" target="_blank" style={{ color: 'var(--amber)', textDecoration: 'underline' }}>Terms & Conditions</Link>, including the safety guidelines for meeting other users.
            </span>
          </label>

          <button className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating your account...' : 'Create account'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--amber)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}


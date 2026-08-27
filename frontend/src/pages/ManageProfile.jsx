import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ManageProfile() {
  const { user, updateUserLocal } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    linkedinUrl: user?.linkedinUrl || '',
    instagramUrl: user?.instagramUrl || '',
    websiteUrl: user?.websiteUrl || '',
  });
  const [preview, setPreview] = useState(user?.profilePicUrl || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }
    setError('');
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file)); // instant local preview before upload finishes
  };

  const handleRemovePicture = async () => {
    try {
      const { data } = await api.delete('/auth/me/profile-picture');
      updateUserLocal({ profilePicUrl: data.profilePicUrl });
      setPreview('');
      setSelectedFile(null);
    } catch (err) {
      setError('Could not remove picture');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      // 1. Save text fields
      const { data: updatedUser } = await api.put('/auth/me', form);
      updateUserLocal(updatedUser);

      // 2. If a new picture was chosen, upload it separately (multipart)
      if (selectedFile) {
        setUploadingPic(true);
        const fd = new FormData();
        fd.append('profilePic', selectedFile);
        const { data: withPic } = await api.post('/auth/me/profile-picture', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUserLocal({ profilePicUrl: withPic.profilePicUrl });
        setUploadingPic(false);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const initial = form.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="container fade-in-up" style={{ maxWidth: 520 }}>
      <h2 style={{ marginBottom: 4 }}>Manage Profile</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 20 }}>
        This is what other people see when they view your profile.
      </p>

      <div className="card">
        {error && <p className="error-text">{error}</p>}
        {success && (
          <p style={{ color: 'var(--teal)', fontSize: 13, marginBottom: 12, background: 'rgba(111,174,143,0.12)', padding: '8px 12px', borderRadius: 8 }} className="fade-in">
            Profile updated
          </p>
        )}

        {/* Avatar + upload controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div
            className={uploadingPic ? 'avatar-uploading' : ''}
            style={{
              width: 84, height: 84, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 700, color: 'var(--ink)', position: 'relative',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            {preview ? (
              <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="fade-in" />
            ) : (
              initial
            )}
            {uploadingPic && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="pic-upload" className="btn btn-sm btn-outline" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: 6 }}>
              Change Photo
            </label>
            <input id="pic-upload" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
            {preview && (
              <button type="button" onClick={handleRemovePicture} className="btn btn-sm btn-danger" style={{ display: 'block' }}>
                Remove
              </button>
            )}
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 6 }}>PNG, JPG, or WEBP · up to 2MB</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label>Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Jodhpur" />
          <label>Bio</label>
          <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell others a bit about yourself" />

          <div style={{ marginTop: 8, marginBottom: 4, paddingTop: 16, borderTop: '1px solid rgba(237,232,216,0.08)' }}>
            <h4 style={{ fontSize: 14, color: 'var(--teal)', marginBottom: 4 }}>Links (optional)</h4>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 14 }}>
              Help potential swap partners get to know you before you meet.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>💼</span> LinkedIn
          </label>
          <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="linkedin.com/in/yourname" />

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>📷</span> Instagram
          </label>
          <input value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} placeholder="instagram.com/yourname" />

          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>🌐</span> Website / Portfolio
          </label>
          <input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="yourwebsite.com" />

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/profile/${user._id}`)}>
              View My Public Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SkillAutocomplete from '../components/SkillAutocomplete';

const CATEGORIES = ['Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const MODES = ['online', 'in-person', 'both'];
const CATEGORY_ICON = { Tech: '\u{1F4BB}', Music: '\u{1F3B8}', Language: '\u{1F5E3}\uFE0F', Fitness: '\u{1F3CB}\uFE0F', Art: '\u{1F3A8}', Cooking: '\u{1F373}', Academic: '\u{1F4DA}', Other: '\u2728' };

function VerifiedBadge() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--teal)', color: 'var(--paper)', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
      ✓ VERIFIED
    </span>
  );
}

export default function MySkills() {
  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'Tech', description: '', level: 'Beginner', mode: 'both' });
  const [certFile, setCertFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get('/skills/mine');
    setSkills(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    try {
      const { data: newSkill } = await api.post('/skills', { ...form, type: showForm });

      // If a certificate file was chosen, upload it right after the skill is created.
      if (certFile) {
        const fd = new FormData();
        fd.append('certificate', certFile);
        await api.post(`/skills/${newSkill._id}/certificate`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setForm({ title: '', category: 'Tech', description: '', level: 'Beginner', mode: 'both' });
      setCertFile(null);
      setShowForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this skill');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/skills/${id}`);
    load();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Certificate file must be under 4MB');
      e.target.value = '';
      return;
    }
    setError('');
    setCertFile(file);
  };

  const viewCertificate = async (skillId) => {
    try {
      const { data } = await api.get(`/skills/${skillId}/certificate`);
      const w = window.open();
      w.document.write(`<iframe src="${data.certificateFile}" style="width:100%;height:100%;border:none;" title="${data.certificateFileName}"></iframe>`);
    } catch (err) {
      alert('Could not load the certificate.');
    }
  };

  const teach = skills.filter((s) => s.type === 'teach');
  const want = skills.filter((s) => s.type === 'want');

  const renderForm = (type) => (
    <div className="card">
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleAdd}>
        <label>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, title: '' })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>Skill</label>
        <SkillAutocomplete category={form.category} value={form.title} onChange={(val) => setForm({ ...form, title: val })} />
        <div style={{ marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Level</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label>Mode</label>
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <label>Description (optional)</label>
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Anything helpful for a potential match to know" />

        {type === 'teach' && (
          <
            <label>
              Upload a certificate (optional)
              <span style={{ color: 'var(--teal)', marginLeft: 6, fontWeight: 600 }}>✓ adds a Verified badge</span>
            </label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ marginBottom: 6 }} />
            {certFile && <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10 }}>Selected: {certFile.name}</p>}
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: -6, marginBottom: 14 }}>PDF, PNG, or JPG · up to 4MB</p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={!form.title.trim() || uploading}>{uploading ? 'Saving...' : 'Save skill'}</button>
          <button type="button" className="btn btn-outline" onClick={() => { setShowForm(null); setError(''); setCertFile(null); }}>Cancel</button>
        </div>
      </form>
    </div>
  );

  const renderSkillCard = (skill, showCert, index) => (
    <div key={skill._id} className="ticket stagger-item" style={{ '--stagger-index': index }}>
      <div className="ticket-eyebrow">{CATEGORY_ICON[skill.category]} {skill.category} · {skill.level} · {skill.mode}</div>
      <div className="ticket-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {skill.title}
        {skill.isVerified && <VerifiedBadge />}
      </div>
      {skill.description && <p style={{ fontSize: 13, color: 'var(--paper-muted)', marginTop: 6 }}>{skill.description}</p>}
      <div className="ticket-divider" />
      <div className="ticket-row">
        {showCert && skill.isVerified ? (
          <button className="btn btn-sm btn-outline" onClick={() => viewCertificate(skill._id)}>View Certificate</button>
        ) : <span></span>}
        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(skill._id)}>Remove</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>My Skills</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 16 }}>
        Both lists work together to find your matches.
      </p>

      <div className="card" style={{ borderLeft: '3px solid var(--amber)', marginBottom: 24 }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--teal)' }}>Left list</strong> = what you can teach someone else.{' '}
          <strong style={{ color: 'var(--amber)' }}>Right list</strong> = what you want someone to teach you.{' '}
          We compare your "want" list against everyone else\u2019s "teach" list (and vice versa) to suggest matches.
        </p>
      </div>

      <div className="two-col">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: 'var(--teal)' }}>→ I Can Teach</h3>
            {showForm !== 'teach' && (
              <button className="btn btn-sm btn-teal" onClick={() => { setShowForm('teach'); setError(''); setForm({ ...form, title: '' }); }}>+ Add</button>
            )}
          </div>
          {showForm === 'teach' && renderForm('teach')}
          {teach.length === 0 && showForm !== 'teach' && (
            <div className="empty-state">
              <div className="icon">{'\u{1F393}'}</div>
              <p style={{ fontSize: 13 }}>Add a skill you're comfortable teaching.</p>
            </div>
          )}
          {teach.map((skill, i) => renderSkillCard(skill, true, i))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: 'var(--amber)' }}>← I Want to Learn</h3>
            {showForm !== 'want' && (
              <button className="btn btn-sm" onClick={() => { setShowForm('want'); setError(''); setForm({ ...form, title: '' }); }}>+ Add</button>
            )}
          </div>
          {showForm === 'want' && renderForm('want')}
          {want.length === 0 && showForm !== 'want' && (
            <div className="empty-state">
              <div className="icon">{'\u{1F50D}'}</div>
              <p style={{ fontSize: 13 }}>Add a skill you'd like someone to teach you.</p>
            </div>
          )}
          {want.map((skill, i) => renderSkillCard(skill, false, i))}
        </div>
      </div>

      {teach.length > 0 && want.length > 0 && (
        <div className="card" style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10 }}>
            You've got both lists filled in — ready to see who matches you?
          </p>
          <button className="btn" onClick={() => navigate('/matches')}>Find My Matches</button>
        </div>
      )}
    </div>
  );
}

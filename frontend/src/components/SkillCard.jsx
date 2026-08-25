import api from '../api/axios';

const CATEGORY_ICON = {
  Tech: '💻', Music: '🎸', Language: '🗣️', Fitness: '🏋️', Art: '🎨', Cooking: '🍳', Academic: '📚', Other: '✨',
};

export default function SkillCard({ skill, actions }) {
  const viewCertificate = async () => {
    try {
      const { data } = await api.get(`/skills/${skill._id}/certificate`);
      const w = window.open();
      w.document.write(`<iframe src="${data.certificateFile}" style="width:100%;height:100%;border:none;" title="certificate"></iframe>`);
    } catch (err) {
      alert('Could not load the certificate.');
    }
  };

  return (
    <div className="ticket">
      <div className="ticket-eyebrow">{CATEGORY_ICON[skill.category] || '✨'} {skill.category} · {skill.level}</div>
      <div className="ticket-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {skill.title}
        {skill.isVerified && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--teal)', color: 'var(--paper)', padding: '2px 8px', borderRadius: 10 }}>
            ✓ VERIFIED
          </span>
        )}
      </div>
      {skill.description && <p style={{ fontSize: 13, color: 'var(--paper-muted)', marginBottom: 8 }}>{skill.description}</p>}
      <div className="ticket-divider" />
      <div className="ticket-row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--paper-muted)' }}>
          {skill.user ? `By ${skill.user.name}${skill.user.trustScore ? ` · ★ ${skill.user.trustScore}` : ''}` : skill.mode}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {skill.isVerified && (
            <button className="btn btn-sm btn-outline" onClick={viewCertificate}>View Certificate</button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

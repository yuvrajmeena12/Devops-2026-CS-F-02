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
    <div className="ticket skill-card-explore">
      <div className="ticket-body">
        <div className="ticket-eyebrow">
          {CATEGORY_ICON[skill.category] || '✨'} {skill.category} · {skill.level}
        </div>
        <div className="ticket-title">
          <span className="ticket-title-text">{skill.title}</span>
          {skill.isVerified && (
            <span className="ticket-badge-verified">
              ✓ VERIFIED
            </span>
          )}
        </div>
        <p className="ticket-desc">
          {skill.description || ''}
        </p>
      </div>

      <div className="ticket-footer">
        <div className="ticket-divider" />
        <div className="ticket-row">
          <div className="ticket-author" title={skill.user ? `By ${skill.user.name}` : skill.mode}>
            {skill.user ? `By ${skill.user.name}${skill.user.trustScore ? ` · ★ ${skill.user.trustScore}` : ''}` : skill.mode}
          </div>
          <div className="ticket-actions">
            {skill.isVerified && (
              <button className="btn btn-sm btn-outline ticket-action" onClick={viewCertificate}>
                View Certificate
              </button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

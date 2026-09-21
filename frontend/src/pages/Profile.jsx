import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import RequestSwapModal from '../components/RequestSwapModal';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [swapSkill, setSwapSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.allSettled([
      api.get(`/auth/user/${id}`),
      api.get(`/skills/user/${id}`),
      api.get(`/reviews/user/${id}`),
    ]).then(([userRes, skillsRes, reviewsRes]) => {
      if (cancelled) return;
      if (userRes.status === 'fulfilled') setProfileUser(userRes.value.data);
      else setError('Could not load this profile. It may not exist, or there was a connection issue.');
      if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value.data);
      if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card fade-in" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--ink-muted)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="container">
        <div className="empty-state fade-in">
          <div className="icon">⚠️</div>
          <p>{error || 'This profile could not be found.'}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === profileUser._id;
  const teach = skills.filter((s) => s.type === 'teach');
  const want = skills.filter((s) => s.type === 'want');

  const viewCertificate = async (skillId) => {
    try {
      const { data } = await api.get(`/skills/${skillId}/certificate`);
      const w = window.open();
      w.document.write(`<iframe src="${data.certificateFile}" style="width:100%;height:100%;border:none;" title="certificate"></iframe>`);
    } catch (err) {
      alert('Could not load the certificate.');
    }
  };

  return (
    <div className="container">
      <section className="profile-hero fade-in-up">
        <div className="profile-cover" />
        <div className="profile-summary">
          <div className="profile-avatar">
            {profileUser.profilePicUrl ? (
              <img src={profileUser.profilePicUrl} alt={profileUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profileUser.name?.charAt(0).toUpperCase()
            )}
          </div>

          <div className="profile-title">
            <h1>{profileUser.name}</h1>
            <p>{profileUser.location || 'Location not set'}</p>
          </div>

          {isOwnProfile && (
            <Link to="/manage-profile" className="btn btn-sm btn-outline">Edit Profile</Link>
          )}
        </div>

        <div className="profile-details">
          {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}

          <div className="profile-stats">
            <span className="badge badge-accepted">
              ★ {profileUser.trustScore ? profileUser.trustScore : 'No ratings yet'}
            </span>
            <span className="badge badge-pending">
              {profileUser.completedSwapsCount || 0} completed swap{profileUser.completedSwapsCount === 1 ? '' : 's'}
            </span>
          </div>

          {(profileUser.linkedinUrl || profileUser.instagramUrl || profileUser.websiteUrl) && (
            <div className="profile-links">
              {profileUser.linkedinUrl && (
                <a href={profileUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  💼 LinkedIn
                </a>
              )}
              {profileUser.instagramUrl && (
                <a href={profileUser.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  📷 Instagram
                </a>
              )}
              {profileUser.websiteUrl && (
                <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  🌐 Website
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="two-col">
        <div>
          <h3 style={{ marginBottom: 10, fontSize: 15, color: 'var(--teal)' }}>Can Teach</h3>
          {teach.length === 0 && (
            <div className="empty-state fade-in" style={{ padding: 24 }}>
              <p style={{ fontSize: 13 }}>Nothing listed yet.</p>
            </div>
          )}
          {teach.map((s, i) => (
            <div key={s._id} className="ticket skill-ticket stagger-item" style={{ '--stagger-index': i }}>
              <div className="ticket-title" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {s.title}
                {s.isVerified && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--teal)', color: 'var(--paper)', padding: '2px 8px', borderRadius: 10 }}>
                    ✓ VERIFIED
                  </span>
                )}
              </div>
              <div className="ticket-meta">{s.category} · {s.level}</div>
              <div className="ticket-divider" />
              <div className="ticket-row">
                {s.isVerified ? (
                  <button className="btn btn-sm btn-outline ticket-action" onClick={() => viewCertificate(s._id)}>View Certificate</button>
                ) : <span></span>}
                {!isOwnProfile && (
                  <button className="btn btn-sm" onClick={() => setSwapSkill(s)}>Request Swap</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ marginBottom: 10, fontSize: 15, color: 'var(--amber)' }}>Wants to Learn</h3>
          {want.length === 0 && (
            <div className="empty-state fade-in" style={{ padding: 24 }}>
              <p style={{ fontSize: 13 }}>Nothing listed yet.</p>
            </div>
          )}
          {want.map((s, i) => (
            <div key={s._id} className="ticket skill-ticket stagger-item" style={{ '--stagger-index': i }}>
              <div className="ticket-title" style={{ fontSize: 15 }}>{s.title}</div>
              <div className="ticket-meta">{s.category} · {s.level}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fade-in-up">
        <h3 style={{ marginBottom: 10 }}>Reviews</h3>
        {reviews.length === 0 && <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>No reviews yet.</p>}
        {reviews.map((r, i) => (
          <div key={r._id} className="stagger-item" style={{ '--stagger-index': i, marginBottom: 12, borderBottom: '1px solid rgba(237,232,216,0.08)', paddingBottom: 10 }}>
            <StarRating value={r.rating} readOnly />
            {r.comment && <p style={{ fontSize: 13, marginTop: 4 }}>{r.comment}</p>}
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>— {r.reviewer?.name || 'Anonymous'}</p>
          </div>
        ))}
      </div>

      {swapSkill && <RequestSwapModal skill={{ ...swapSkill, user: profileUser }} onClose={() => setSwapSkill(null)} />}
    </div>
  );
}
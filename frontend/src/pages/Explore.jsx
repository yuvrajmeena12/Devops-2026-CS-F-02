import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SkillCard from '../components/SkillCard';
import RequestSwapModal from '../components/RequestSwapModal';

const CATEGORIES = ['', 'Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'];

export default function Explore() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('teach'); // 'teach', 'want', or 'all'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data, headers } = await api.get('/skills', {
        params: {
          type: typeFilter === 'all' ? undefined : typeFilter,
          search: search.trim() || undefined,
          category: category || undefined,
          page: pageNum,
          limit: 30,
        },
      });
      setSkills(data);
      const totalCount = parseInt(headers['x-total-count'] || '0', 10);
      setHasMore(totalCount > pageNum * 30);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    const debounce = setTimeout(() => load(1), 300);
    return () => clearTimeout(debounce);
  }, [search, category, typeFilter]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMessageUser = (skill) => {
    if (skill.user?._id) {
      navigate(`/messages?user=${skill.user._id}&skill=${skill._id}`);
    }
  };

  return (
    <div className="container">
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', marginBottom: 8, fontWeight: 800 }}>
          Explore Skills Directory
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          Discover skills taught and wanted by ambitious learners and mentors across the community.
        </p>
      </div>

      {/* Search & Filter Matrix */}
      <div className="card" style={{ marginBottom: 28, padding: '24px' }}>
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <input
            placeholder="Search by skill name, topic, or keyword (e.g. Python, UI/UX, Spanish, Guitar)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              fontSize: 14.5, 
              padding: '14px 18px', 
              paddingLeft: '44px',
              marginBottom: 0,
              background: 'rgba(9, 13, 23, 0.85)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)'
            }}
          />
          <span style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            fontSize: 16,
            color: 'var(--text-muted)'
          }}>
            🔍
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* Category Tabs */}
          <div className="tabs" style={{ margin: 0, overflowX: 'auto', maxWidth: '100%' }}>
            {CATEGORIES.map((c) => (
              <div
                key={c || 'all'}
                className={`tab ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c || 'All Categories'}
              </div>
            ))}
          </div>

          {/* Type Filter Controls */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', marginRight: 4, fontWeight: 600 }}>Filter:</span>
            <button
              className={`btn btn-sm ${typeFilter === 'teach' ? 'btn-teal' : 'btn-outline'}`}
              onClick={() => setTypeFilter('teach')}
            >
              Skills Offered
            </button>
            <button
              className={`btn btn-sm ${typeFilter === 'want' ? '' : 'btn-outline'}`}
              onClick={() => setTypeFilter('want')}
            >
              Skills Wanted
            </button>
            <button
              className={`btn btn-sm btn-outline`}
              style={{ 
                background: typeFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : undefined,
                color: typeFilter === 'all' ? '#ffffff' : undefined
              }}
              onClick={() => setTypeFilter('all')}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Skill Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="spin" style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 15 }}>Querying skill directory...</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {skills.map((skill, i) => (
              <div key={skill._id} className="stagger-item" style={{ '--stagger-index': Math.min(i, 12) }}>
                <SkillCard
                  skill={skill}
                  onRequestSwap={() => setSelectedSkill(skill)}
                  onMessage={() => handleMessageUser(skill)}
                />
              </div>
            ))}
          </div>

          {skills.length === 0 && (
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="icon">🔍</div>
              <h3 style={{ fontSize: 18, marginBottom: 6, color: 'var(--text-main)' }}>No matching skills found</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Try adjusting your search criteria, switching categories, or toggling between Offered and Wanted.
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {(page > 1 || hasMore) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 32 }}>
              <button
                className="btn btn-sm btn-outline"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Previous Page
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Page {page}
              </span>
              <button
                className="btn btn-sm btn-outline"
                disabled={!hasMore}
                onClick={() => handlePageChange(page + 1)}
              >
                Next Page →
              </button>
            </div>
          )}
        </>
      )}

      {selectedSkill && (
        <RequestSwapModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

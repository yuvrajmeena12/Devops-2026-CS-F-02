import { useEffect, useState } from 'react';
import api from '../api/axios';
import SkillCard from '../components/SkillCard';
import RequestSwapModal from '../components/RequestSwapModal';

const CATEGORIES = ['', 'Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'];

export default function Explore() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);

  const load = async () => {
    const { data } = await api.get('/skills', { params: { type: 'teach', search, category } });
    setSkills(data);
  };

  useEffect(() => { load(); }, [search, category]);

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>Explore Skills</h2>

      <div className="card">
        <input placeholder="Search skill (e.g. guitar, react, spanish)" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="tabs">
          {CATEGORIES.map((c) => (
            <div key={c || 'all'} className={`tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c || 'All'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        {skills.map((skill, i) => (
          <div key={skill._id} className="stagger-item" style={{ '--stagger-index': i }}>
            <SkillCard
              skill={skill}
              actions={<button className="btn btn-sm" onClick={() => setSelectedSkill(skill)}>Request Swap</button>}
            />
          </div>
        ))}
      </div>
      {skills.length === 0 && <p style={{ color: 'var(--ink-muted)' }}>No skills match your search.</p>}

      {selectedSkill && (
        <RequestSwapModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}

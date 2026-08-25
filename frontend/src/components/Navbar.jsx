import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const loadUnread = () => {
      api.get('/notifications').then(({ data }) => {
        setUnread(data.filter((n) => !n.isRead).length);
      }).catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 15000);
    return () => clearInterval(interval);
  }, [user, location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="navbar">
      <Link to="/" className="nav-logo"><span className="mark">⇄</span> SkillSwap</Link>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="nav-links">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`}>Explore</Link>
            <Link to="/matches" className={`nav-link ${isActive('/matches') ? 'active' : ''}`}>Matches</Link>
            <Link to="/my-swaps" className={`nav-link ${isActive('/my-swaps') ? 'active' : ''}`}>My Swaps</Link>
          </div>

          <Link to="/notifications" className="nav-icon-btn" title="Notifications">
            🔔
            {unread > 0 && <span className="nav-badge">{unread}</span>}
          </Link>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className="nav-avatar" onClick={() => setMenuOpen(!menuOpen)} style={{ overflow: 'hidden', padding: 0 }}>
              {user.profilePicUrl ? (
                <img src={user.profilePicUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </button>
            {menuOpen && (
              <div className="nav-menu">
                <Link to="/my-skills" onClick={() => setMenuOpen(false)}>My Skills</Link>
                <Link to={`/profile/${user._id}`} onClick={() => setMenuOpen(false)}>My Profile</Link>
                <Link to="/manage-profile" onClick={() => setMenuOpen(false)}>Manage Profile</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>}
                <button onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/register" className="btn btn-sm">Get started</Link>
        </div>
      )}
    </div>
  );
}

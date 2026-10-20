import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import korvilLogo from '../../assets/logo';
import { useWorkSubmissions } from '../../hooks/useWorkSubmissions';
import {
  FiGrid,
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiList,
  FiFileText,
  FiLogOut,
  FiShield,
  FiX,
} from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }) {
  const { userProfile, isAdmin, logout } = useAuth();
  const { awaitingCount, changesRequestedCount } = useWorkSubmissions();
  const navigate = useNavigate();

  const badgeCount = isAdmin ? awaitingCount : changesRequestedCount;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside id="app-sidebar" className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
      {/* Brand & Clickable Logo */}
      <div className="sidebar-brand">
        <Link
          to="/dashboard"
          className="brand-logo-link"
          onClick={onClose}
          aria-label="Go to Korvil TaskFlow Dashboard"
        >
          <div className="sidebar-logo-badge" title="Korvil TaskFlow">
            <img
              src={korvilLogo}
              alt="Korvil TaskFlow logo"
              className="brand-logo"
              width="32"
              height="32"
              loading="eager"
              onError={(e) => {
                const base = import.meta.env.BASE_URL || '/';
                e.currentTarget.src = `${base}korvil-logo.png`.replace('//', '/');
              }}
            />
          </div>
          <div className="brand-info">
            <h2>TaskFlow</h2>
            <span>TEAM WORKSPACE</span>
          </div>
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-icon sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="link-icon"><FiGrid /></span>
            Dashboard
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="link-icon"><FiCheckSquare /></span>
            Tasks
          </NavLink>
          <NavLink
            to="/personal-todos"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="link-icon"><FiList /></span>
            Personal To-Dos
          </NavLink>
          <NavLink
            to="/work-submissions"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="link-icon"><FiFileText /></span>
            Work Submissions
            {badgeCount > 0 && (
              <span className="nav-badge" title={isAdmin ? `${badgeCount} awaiting review` : `${badgeCount} updates`}>
                {badgeCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="link-icon"><FiBarChart2 /></span>
            Analytics
          </NavLink>
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Admin</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="link-icon"><FiUsers /></span>
              Team Members
            </NavLink>
            <NavLink
              to="/admin-settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="link-icon"><FiShield /></span>
              Admin Settings
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName || 'User profile'}
              width="36"
              height="36"
              loading="lazy"
            />
          ) : (
            getInitials(userProfile?.displayName)
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{userProfile?.displayName}</div>
          <div className="user-role">
            {userProfile?.role === 'admin' ? '🛡️ Admin' : '👤 Employee'}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}

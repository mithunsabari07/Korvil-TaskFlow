import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiGrid,
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiList,
  FiLogOut,
  FiShield,
  FiX,
} from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }) {
  const { userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

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
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <img src="/korvil-logo.png" alt="Korvil" className="brand-logo" />
        <div className="brand-info">
          <h2>TaskFlow</h2>
          <span>by Korvil</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onClose}
          style={{ marginLeft: 'auto', display: isOpen ? 'flex' : 'none' }}
        >
          <FiX />
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
            <img src={userProfile.photoURL} alt={userProfile.displayName} />
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
          className="btn btn-ghost btn-icon"
          onClick={handleLogout}
          title="Sign out"
        >
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}

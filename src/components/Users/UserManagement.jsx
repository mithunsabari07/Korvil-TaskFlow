import { useState } from 'react';
import { FiPlus, FiTrash2, FiMail, FiUser, FiEdit2, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Skeleton, SkeletonUserCard } from '../Common/Skeleton';

export default function UserManagement() {
  useDocumentTitle('Team Members', 'Manage employees, register accounts, and view user details.');
  const { userProfile } = useAuth();
  const { users, employees, loading: usersLoading, addEmployee, updateEmployee, removeEmployee } = useUsers();
  const toast = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingUser, setRemovingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');

  async function handleAddEmployee(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoading(true);
    try {
      await addEmployee(newEmail.trim(), newName.trim());
      toast.success(`Invited ${newEmail.trim()} successfully! They can now sign up.`);
      setNewEmail('');
      setNewName('');
      setShowAddForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditEmployee(e) {
    e.preventDefault();
    if (!editingUser || !editName.trim()) return;
    setLoading(true);
    try {
      await updateEmployee(editingUser.email, editName.trim());
      toast.success(`Updated name to ${editName.trim()} successfully!`);
      setEditingUser(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveEmployee() {
    if (!removingUser) return;
    try {
      await removeEmployee(removingUser.uid, removingUser.email);
      toast.success(`Removed ${removingUser.displayName || removingUser.email}`);
    } catch (err) {
      toast.error(err.message || 'Failed to remove employee');
    }
    setRemovingUser(null);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  if (usersLoading) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>Team Members</h1>
            <p className="header-subtitle">
              <Skeleton width="180px" height="14px" />
            </p>
          </div>
          <div className="header-actions">
            <Skeleton width="130px" height="40px" borderRadius="var(--radius-md)" />
          </div>
        </div>

        <div className="page-content">
          <SkeletonUserCard count={4} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Team Members</h1>
          <p className="header-subtitle">
            Manage your team • {users.length} member{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <FiPlus /> Add Employee
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Add Employee Form */}
        {showAddForm && (
          <div className="chart-container animate-fadeIn" style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              <FiMail style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Add New Employee
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              Enter the employee's email. They'll be able to sign up once registered here.
            </p>
            <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                <label htmlFor="emp-name">Full Name</label>
                <input
                  id="emp-name"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                <label htmlFor="emp-email">Email Address *</label>
                <input
                  id="emp-email"
                  type="email"
                  className="form-input"
                  placeholder="employee@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Grid */}
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No team members yet</h3>
            <p>Add your first employee to get started</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <FiPlus /> Add Employee
            </button>
          </div>
        ) : (
          <div className="user-grid">
            {users.map((user, i) => (
              <div
                key={user.uid}
                className="user-card"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="user-avatar-lg">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    getInitials(user.displayName)
                  )}
                </div>
                <div className="user-details">
                  <h3>{user.displayName || 'Unnamed'}</h3>
                  <p>
                    <a href={`mailto:${user.email}`} className="email-link" title={`Email ${user.email}`}>
                      {user.email}
                    </a>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                  {user.isPending ? (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'var(--warning-bg)',
                        color: 'var(--warning)',
                        border: '1px solid var(--warning-border)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Invited
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        border: '1px solid var(--success-border)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                {/* Action buttons for employees */}
                {user.role !== 'admin' && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => {
                        setEditingUser(user);
                        setEditName(user.displayName || '');
                      }}
                      title="Edit employee name"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setRemovingUser(user)}
                      title="Remove employee"
                      style={{ color: 'var(--danger)' }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Edit Employee</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingUser(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingUser.email}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-name">Display Name *</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    autoFocus
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    This name will appear on tasks, analytics, and their account in TaskFlow.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      {removingUser && (
        <ConfirmDialog
          title="Remove Employee"
          message={`Are you sure you want to remove ${removingUser.displayName || removingUser.email}? They will lose access to the platform.`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={handleRemoveEmployee}
          onCancel={() => setRemovingUser(null)}
        />
      )}
    </>
  );
}

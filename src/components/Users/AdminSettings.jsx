import { useState } from 'react';
import { FiShield, FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { useToast } from '../../contexts/ToastContext';
import { PRIMARY_ADMIN_EMAIL } from '../../firebase/config';
import ConfirmDialog from '../Common/ConfirmDialog';

export default function AdminSettings() {
  const { userProfile, isPrimaryAdmin } = useAuth();
  const { users, addAdmin, removeAdmin, makeAdmin } = useUsers();
  const toast = useToast();

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState(null);

  const adminUsers = users.filter(u => u.role === 'admin');
  const employeeUsers = users.filter(u => u.role === 'employee');

  async function handleAddAdmin(e) {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    setLoading(true);
    try {
      await addAdmin(adminEmail.trim());
      toast.success(`${adminEmail.trim()} is now an admin!`);
      setAdminEmail('');
      setShowAddAdmin(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveAdmin() {
    if (!removingAdmin) return;
    try {
      await removeAdmin(removingAdmin.uid, removingAdmin.email);
      toast.success(`${removingAdmin.displayName || removingAdmin.email} is now an employee`);
    } catch (err) {
      toast.error(err.message || 'Failed to remove admin');
    }
    setRemovingAdmin(null);
  }

  async function handlePromoteToAdmin(user) {
    try {
      await makeAdmin(user.uid);
      toast.success(`${user.displayName || user.email} is now an admin!`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1><FiShield style={{ verticalAlign: 'middle' }} /> Admin Settings</h1>
          <p className="header-subtitle">Manage admin roles and system settings</p>
        </div>
      </div>

      <div className="page-content">
        {!isPrimaryAdmin && (
          <div className="error-message" style={{ marginBottom: 'var(--space-6)', background: 'var(--warning-bg)', borderColor: 'var(--warning-border)', color: 'var(--warning)' }}>
            <FiAlertCircle />
            <span>Only the primary admin ({PRIMARY_ADMIN_EMAIL}) can manage admin roles.</span>
          </div>
        )}

        {/* Current Admins */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3>🛡️ Admin Users ({adminUsers.length})</h3>
            {isPrimaryAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddAdmin(true)}>
                <FiPlus size={14} /> Add Admin
              </button>
            )}
          </div>

          {/* Add Admin Form */}
          {showAddAdmin && (
            <form onSubmit={handleAddAdmin} style={{
              display: 'flex',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-4)',
              background: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-md)',
            }}>
              <input
                type="email"
                className="form-input"
                placeholder="Enter email address"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddAdmin(false)}>
                Cancel
              </button>
            </form>
          )}

          <div className="user-grid">
            {adminUsers.map(user => (
              <div key={user.uid} className="user-card">
                <div className="user-avatar-lg">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} />
                  ) : (
                    getInitials(user.displayName)
                  )}
                </div>
                <div className="user-details">
                  <h3>
                    {user.displayName || 'Unnamed'}
                    {user.email === PRIMARY_ADMIN_EMAIL && (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--warning)', marginLeft: 8 }}>
                        👑 Primary
                      </span>
                    )}
                  </h3>
                  <p>{user.email}</p>
                </div>
                {isPrimaryAdmin && user.email !== PRIMARY_ADMIN_EMAIL && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setRemovingAdmin(user)}
                    title="Remove admin role"
                  >
                    <FiTrash2 size={14} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Promote Employee to Admin */}
        {isPrimaryAdmin && employeeUsers.length > 0 && (
          <div className="chart-container" style={{ marginTop: 'var(--space-5)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>👤 Promote to Admin</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-4)' }}>
              Promote an existing employee to admin role.
            </p>
            <div className="user-grid">
              {employeeUsers.map(user => (
                <div key={user.uid} className="user-card">
                  <div className="user-avatar-lg">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} />
                    ) : (
                      getInitials(user.displayName)
                    )}
                  </div>
                  <div className="user-details">
                    <h3>{user.displayName || 'Unnamed'}</h3>
                    <p>{user.email}</p>
                  </div>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handlePromoteToAdmin(user)}
                  >
                    <FiShield size={14} /> Make Admin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove Admin Confirmation */}
      {removingAdmin && (
        <ConfirmDialog
          title="Remove Admin Role"
          message={`Remove admin access from ${removingAdmin.displayName || removingAdmin.email}? They will become a regular employee.`}
          confirmLabel="Remove Admin"
          variant="danger"
          onConfirm={handleRemoveAdmin}
          onCancel={() => setRemovingAdmin(null)}
        />
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';

export default function TaskForm({ task, onSubmit, onClose, isPersonalTodo = false }) {
  const { userProfile, isAdmin } = useAuth();
  const { employees, users } = useUsers();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!task;

  const [assignedToEmail, setAssignedToEmail] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssignedTo(task.assignedTo || '');
      setAssignedToName(task.assignedToName || '');
      setAssignedToEmail(task.assignedToEmail || '');
    } else {
      setAssignedTo(userProfile?.uid || '');
      setAssignedToName(userProfile?.displayName || '');
      setAssignedToEmail(userProfile?.email || '');
    }
  }, [task, userProfile]);

  function handleAssigneeChange(e) {
    const val = e.target.value;
    setAssignedTo(val);
    const user = users.find(u => u.uid === val || u.email?.toLowerCase() === val.toLowerCase());
    setAssignedToName(user?.displayName || user?.email || '');
    setAssignedToEmail(user?.email?.toLowerCase() || (val.includes('@') ? val.toLowerCase() : ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignedTo: isPersonalTodo ? userProfile.uid : (assignedTo || userProfile.uid),
        assignedToEmail: isPersonalTodo ? userProfile.email : (assignedToEmail || (assignedTo?.includes('@') ? assignedTo : userProfile.email)),
        assignedToName: isPersonalTodo ? userProfile.displayName : (assignedToName || userProfile.displayName),
        isPersonalTodo,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get list of assignable users (all users for admin)
  const assignableUsers = isAdmin ? users : [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>
            {isEditing
              ? 'Edit Task'
              : isPersonalTodo
              ? 'New Personal To-Do'
              : 'New Task'}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="task-title">Task Title *</label>
              <input
                id="task-title"
                type="text"
                className="form-input"
                placeholder="e.g., Build the prototype"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                className="form-input"
                placeholder="Add details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Assign to someone (admin only, not for personal todos) */}
            {isAdmin && !isPersonalTodo && (
              <div className="form-group">
                <label htmlFor="task-assignee">Assign To</label>
                <select
                  id="task-assignee"
                  className="form-select"
                  value={assignedTo}
                  onChange={handleAssigneeChange}
                >
                  <option value="">Select team member</option>
                  {assignableUsers.map(user => (
                    <option key={user.uid || user.email} value={user.uid || user.email}>
                      {user.displayName || user.email}
                      {user.role === 'admin' ? ' (Admin)' : user.isPending ? ' (Invited)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !title.trim()}>
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

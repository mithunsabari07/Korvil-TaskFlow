import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckSquare,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiZap,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import TaskCard from '../Tasks/TaskCard';
import { useToast } from '../../contexts/ToastContext';
import TaskDeliverableModal from '../WorkSubmissions/TaskDeliverableModal';
import ConfirmDialog from '../Common/ConfirmDialog';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function Dashboard() {
  useDocumentTitle('Dashboard', 'Real-time overview of tasks, team progress, and key productivity metrics.');

  const { userProfile, isAdmin } = useAuth();
  const { tasks, toggleTaskStatus, changeTaskStatus, deleteTask } = useTasks();
  const { users } = useUsers();
  const navigate = useNavigate();
  const toast = useToast();

  const [deliverableTask, setDeliverableTask] = useState(null);
  const [completionPromptTask, setCompletionPromptTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  // Compute stats
  const stats = useMemo(() => {
    const workTasks = tasks.filter(t => !t.isPersonalTodo);
    const total = workTasks.length;
    const completed = workTasks.filter(t => t.status === 'completed').length;
    const inProgress = workTasks.filter(t => t.status === 'in-progress').length;
    const pending = workTasks.filter(t => t.status === 'todo').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, rate };
  }, [tasks]);

  // Recent tasks (latest 5)
  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isPersonalTodo)
      .slice(0, 5);
  }, [tasks]);

  // Pending tasks needing attention
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'todo' && !t.isPersonalTodo)
      .slice(0, 3);
  }, [tasks]);

  async function handleToggle(taskId, currentStatus) {
    const task = tasks.find(t => t.id === taskId);
    await toggleTaskStatus(taskId, currentStatus);
    if (currentStatus !== 'completed' && task && !task.isPersonalTodo && !task.hasSubmission) {
      setCompletionPromptTask(task);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    await changeTaskStatus(taskId, newStatus);
    if (newStatus === 'completed' && task && !task.isPersonalTodo && !task.hasSubmission) {
      setCompletionPromptTask(task);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      toast.success('Task deleted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
    } finally {
      setDeletingTask(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            {getGreeting()}, {userProfile?.displayName?.split(' ')[0] || 'Team Member'} 👋
          </h1>
          <p className="header-subtitle">
            {isAdmin
              ? "Here's your team's overview"
              : "Here's your work summary"}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
            <FiPlus /> New Task
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div
            className="stat-card"
            style={{ animationDelay: '0s', cursor: 'pointer' }}
            onClick={() => navigate('/tasks')}
            title="View all tasks"
          >
            <div className="stat-header">
              <div className="stat-icon primary">
                <FiCheckSquare />
              </div>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">
              {isAdmin ? `Across ${users.filter(u => u.role === 'employee').length} team members` : 'Assigned to you'}
            </div>
          </div>

          <div
            className="stat-card"
            style={{ animationDelay: '0.1s', cursor: 'pointer' }}
            onClick={() => navigate('/tasks?status=completed')}
            title="View completed tasks"
          >
            <div className="stat-header">
              <div className="stat-icon success">
                <FiTrendingUp />
              </div>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-change">{stats.rate}% completion rate</div>
          </div>

          <div
            className="stat-card"
            style={{ animationDelay: '0.2s', cursor: 'pointer' }}
            onClick={() => navigate('/tasks?status=in-progress')}
            title="View in-progress tasks"
          >
            <div className="stat-header">
              <div className="stat-icon warning">
                <FiZap />
              </div>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-change">Currently being worked on</div>
          </div>

          <div
            className="stat-card"
            style={{ animationDelay: '0.3s', cursor: 'pointer' }}
            onClick={() => navigate('/tasks?status=todo')}
            title="View pending tasks"
          >
            <div className="stat-header">
              <div className="stat-icon danger">
                <FiClock />
              </div>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-change">Waiting to be started</div>
          </div>
        </div>

        {/* Quick Actions & Recent Responsive Columns */}
        <div className="dashboard-task-columns">
          {/* Urgent Tasks */}
          <div>
            <div className="task-section-header">
              <h2>⚡ Needs Attention</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
                View All <FiArrowRight />
              </button>
            </div>
            {urgentTasks.length > 0 ? (
              urgentTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => navigate('/tasks')}
                  onDelete={setDeletingTask}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
                  onViewSubmission={() => navigate('/work-submissions')}
                  onSubmitDeliverable={(t) => setDeliverableTask(t)}
                />
              ))
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-icon">🎉</div>
                <h3>All caught up!</h3>
                <p>No pending tasks</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <div className="task-section-header">
              <h2>📋 Recent Tasks</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
                View All <FiArrowRight />
              </button>
            </div>
            {recentTasks.length > 0 ? (
              recentTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => navigate('/tasks')}
                  onDelete={setDeletingTask}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
                  onViewSubmission={() => navigate('/work-submissions')}
                  onSubmitDeliverable={(t) => setDeliverableTask(t)}
                />
              ))
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-icon">📭</div>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Overview for Admin */}
        {isAdmin && users.length > 0 && (
          <div style={{ marginTop: 'var(--space-8)' }}>
            <div className="task-section-header">
              <h2><FiUsers style={{ verticalAlign: 'middle' }} /> Team Overview</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/users')}>
                Manage Team <FiArrowRight />
              </button>
            </div>
            <div className="chart-container">
              <div className="table-responsive-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Total</th>
                      <th>Completed</th>
                      <th>Pending</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const userTasks = tasks.filter(t => t.assignedTo === user.uid && !t.isPersonalTodo);
                      const completed = userTasks.filter(t => t.status === 'completed').length;
                      const total = userTasks.length;
                      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                      return (
                        <tr key={user.uid}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>
                                {user.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'Member'}
                                    width="28"
                                    height="28"
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  (user.displayName || user.email)?.[0]?.toUpperCase()
                                )}
                              </div>
                              <a
                                href={`mailto:${user.email}`}
                                className="email-link"
                                style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                                title={`Email ${user.email}`}
                              >
                                {user.displayName || user.email}
                              </a>
                              {user.role === 'admin' && (
                                <span className="role-badge admin" style={{ fontSize: '10px', padding: '1px 6px' }}>Admin</span>
                              )}
                            </div>
                          </td>
                          <td>{total}</td>
                          <td style={{ color: 'var(--success)' }}>{completed}</td>
                          <td style={{ color: 'var(--warning)' }}>{total - completed}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${rate}%` }}></div>
                              </div>
                              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Deliverable Prompt Modal */}
      {completionPromptTask && (
        <div className="modal-backdrop" onClick={() => setCompletionPromptTask(null)}>
          <div
            className="modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-lg)' }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span> Task Completed!
              </h2>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setCompletionPromptTask(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 'var(--space-5) var(--space-6)' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                "{completionPromptTask.title}"
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>
                Would you like to upload your work deliverable (PDF file) for founder or admin review?
                <br />
                <strong>Note:</strong> This is optional — you can upload your PDF deliverable now or keep the task completed without uploading.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCompletionPromptTask(null)}
              >
                Just Complete (Skip)
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const t = completionPromptTask;
                  setCompletionPromptTask(null);
                  setDeliverableTask(t);
                }}
              >
                <FiUploadCloud /> Upload PDF Deliverable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Deliverable Upload Modal */}
      {deliverableTask && (
        <TaskDeliverableModal
          task={deliverableTask}
          isOpen={!!deliverableTask}
          onClose={() => setDeliverableTask(null)}
          onSuccess={() => {
            setDeliverableTask(null);
          }}
        />
      )}

      {/* Task Delete Confirmation Dialog */}
      {deletingTask && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

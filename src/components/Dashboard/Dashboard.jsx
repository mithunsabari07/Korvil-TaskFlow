import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckSquare,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import TaskCard from '../Tasks/TaskCard';
import { useToast } from '../../contexts/ToastContext';

export default function Dashboard() {
  const { userProfile, isAdmin } = useAuth();
  const { tasks, toggleTaskStatus, changeTaskStatus } = useTasks();
  const { users } = useUsers();
  const navigate = useNavigate();
  const toast = useToast();

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

  async function handleToggle(taskId, status) {
    await toggleTaskStatus(taskId, status);
  }

  async function handleStatusChange(taskId, newStatus) {
    await changeTaskStatus(taskId, newStatus);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>
            {getGreeting()}, {userProfile?.displayName?.split(' ')[0]} 👋
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

        {/* Quick Actions & Recent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
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
                  onDelete={() => {}}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
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
                  onDelete={() => {}}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
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
                                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                (user.displayName || user.email)?.[0]?.toUpperCase()
                              )}
                            </div>
                            <span>{user.displayName || user.email}</span>
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
        )}
      </div>
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

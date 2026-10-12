import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FiCheckSquare,
  FiClock,
  FiTrendingUp,
  FiTarget,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';

const CHART_COLORS = ['#015987', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#0284C7'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { tasks } = useTasks();
  const { users } = useUsers();
  const [period, setPeriod] = useState('weekly');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Filter tasks for analytics
  const filteredTasks = useMemo(() => {
    if (!isAdmin) return tasks;
    if (selectedEmployee) return tasks.filter(t => t.assignedTo === selectedEmployee);
    return tasks;
  }, [tasks, isAdmin, selectedEmployee]);

  const analytics = useAnalytics(filteredTasks, period, users);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Completed', value: analytics.completedTasks, color: '#16A34A' },
      { name: 'In Progress', value: analytics.inProgressTasks, color: '#D97706' },
      { name: 'To Do', value: analytics.pendingTasks, color: '#0284C7' },
    ].filter(d => d.value > 0);
  }, [analytics]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
          {payload[0]?.payload?.fullDate || label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '13px' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="header-subtitle">
            {isAdmin
              ? selectedEmployee
                ? 'Individual employee analytics'
                : 'Overall team performance'
              : 'Your performance overview'}
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Controls */}
        <div className="analytics-controls">
          {/* Period Tabs */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                className={`tab ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Employee filter for admin */}
          {isAdmin && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Team Members</option>
              {users.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/tasks')}
            title="View all tasks"
          >
            <div className="stat-header">
              <div className="stat-icon primary"><FiCheckSquare /></div>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-value">{analytics.totalTasks}</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/tasks?status=completed')}
            title="View completed tasks"
          >
            <div className="stat-header">
              <div className="stat-icon success"><FiTrendingUp /></div>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">{analytics.completedTasks}</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/tasks?status=todo')}
            title="View pending tasks"
          >
            <div className="stat-header">
              <div className="stat-icon warning"><FiClock /></div>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-value">{analytics.pendingTasks + analytics.inProgressTasks}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon info"><FiTarget /></div>
              <span className="stat-label">Completion Rate</span>
            </div>
            <div className="stat-value">{analytics.completionRate}%</div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-5)' }}>
          {/* Bar Chart */}
          <div className="chart-container">
            <h3>Tasks Overview ({period})</h3>
            {analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="assigned" name="Assigned" fill="#015987" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <p>No data for this period</p>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="chart-container">
            <h3>Status Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#64748B' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <p>No tasks to visualize</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee Breakdown Table (Admin only) */}
        {isAdmin && !selectedEmployee && analytics.employeeStats.length > 0 && (
          <div className="chart-container" style={{ marginTop: 'var(--space-5)' }}>
            <h3>Employee Performance</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Pending</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.employeeStats.map(emp => (
                  <tr key={emp.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>
                          {emp.photoURL ? (
                            <img src={emp.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            emp.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{emp.name}</div>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.total}</td>
                    <td style={{ color: 'var(--success)' }}>{emp.completed}</td>
                    <td style={{ color: 'var(--warning)' }}>{emp.inProgress}</td>
                    <td style={{ color: 'var(--info)' }}>{emp.pending}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${emp.rate}%` }}></div>
                        </div>
                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {emp.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

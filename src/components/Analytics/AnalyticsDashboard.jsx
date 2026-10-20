import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FiCheckSquare,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiAlertCircle,
  FiZap,
  FiCalendar,
  FiUser,
  FiLayers,
  FiList,
  FiCheckCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getPriorityInfo, getStatusInfo, isTaskOverdue } from '../../utils/permissions';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Skeleton, SkeletonKPI, SkeletonChart } from '../Common/Skeleton';

export default function AnalyticsDashboard() {
  useDocumentTitle('Analytics', 'Analytics for assigned tasks, completion rates, and personal productivity metrics.');
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { tasks, loading } = useTasks();
  const { users } = useUsers();

  const [period, setPeriod] = useState('weekly');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Filter tasks based on selected employee (admin) or current user (employee)
  const roleFilteredTasks = useMemo(() => {
    if (isAdmin) {
      if (selectedEmployee) {
        const filterVal = selectedEmployee.toLowerCase();
        return tasks.filter(t =>
          t.assignedTo === selectedEmployee ||
          t.assignedTo?.toLowerCase() === filterVal ||
          t.assignedToEmail?.toLowerCase() === filterVal ||
          t.createdBy === selectedEmployee
        );
      }
      return tasks;
    } else {
      const myUid = userProfile?.uid;
      const myEmail = userProfile?.email?.toLowerCase();
      return tasks.filter(t =>
        t.assignedTo === myUid ||
        t.assignedTo?.toLowerCase() === myEmail ||
        t.assignedToEmail?.toLowerCase() === myEmail ||
        t.createdBy === myUid
      );
    }
  }, [tasks, isAdmin, selectedEmployee, userProfile]);

  // Compute separate analytics datasets
  const analytics = useAnalytics(roleFilteredTasks, period, users, customRange);
  const { assigned, personal } = analytics;

  // Selected employee name for custom headers
  const selectedEmployeeObj = useMemo(() => {
    if (!selectedEmployee) return null;
    return users.find(u => u.uid === selectedEmployee || u.email?.toLowerCase() === selectedEmployee.toLowerCase());
  }, [selectedEmployee, users]);

  const selectedEmployeeName = selectedEmployeeObj?.displayName || selectedEmployeeObj?.email;

  // Helper date formatter
  function formatTaskDate(val) {
    if (!val) return '—';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  }

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="analytics-tooltip">
        <p className="tooltip-title">
          {payload[0]?.payload?.fullDate || label}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill, fontSize: '12px', margin: '3px 0' }}>
            <span style={{ fontWeight: 600 }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  };
  if (loading) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <p className="header-subtitle">
              Track assigned work, personal productivity, and task completion.
            </p>
          </div>
        </div>

        <div className="page-content">
          <div className="analytics-controls-panel" style={{ pointerEvents: 'none', opacity: 0.8 }}>
            <Skeleton width="280px" height="38px" borderRadius="var(--radius-full)" />
          </div>

          <section className="analytics-section">
            <div className="section-header-block">
              <Skeleton width="180px" height="22px" style={{ marginBottom: 8 }} />
              <Skeleton width="280px" height="28px" style={{ marginBottom: 8 }} />
              <Skeleton width="340px" height="14px" />
            </div>

            <SkeletonKPI count={6} columns="kpi-grid-6" />

            <div className="analytics-chart-row" style={{ marginTop: 'var(--space-6)' }}>
              <SkeletonChart height={280} />
              <SkeletonChart height={280} />
            </div>
          </section>

          <section className="analytics-section" style={{ marginTop: 'var(--space-8)' }}>
            <div className="section-header-block">
              <Skeleton width="180px" height="22px" style={{ marginBottom: 8 }} />
              <Skeleton width="280px" height="28px" style={{ marginBottom: 8 }} />
              <Skeleton width="340px" height="14px" />
            </div>

            <SkeletonKPI count={5} columns="kpi-grid-5" />

            <div className="analytics-chart-row" style={{ marginTop: 'var(--space-6)' }}>
              <SkeletonChart height={280} />
              <SkeletonChart height={280} />
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="header-subtitle">
            Track assigned work, personal productivity, and task completion.
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Controls: Period Tabs & Employee Selector */}
        <div className="analytics-controls-panel">
          <div className="analytics-controls-left">
            <div className="tabs" style={{ marginBottom: 0 }}>
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'custom', label: 'Custom' },
              ].map(p => (
                <button
                  key={p.id}
                  className={`tab ${period === p.id ? 'active' : ''}`}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {period === 'custom' && (
              <div className="custom-date-inputs">
                <div className="date-input-group">
                  <span className="date-label">From:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={customRange.startDate}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="date-input-group">
                  <span className="date-label">To:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={customRange.endDate}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Employee Filter for Founder/Admin */}
          {isAdmin && (
            <div className="analytics-controls-right">
              <label htmlFor="analytics-emp-select" className="filter-label">
                <FiUser style={{ marginRight: 4 }} /> Employee Filter:
              </label>
              <select
                id="analytics-emp-select"
                className="form-select"
                style={{ width: 'auto', minWidth: '220px' }}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {users.map(u => (
                  <option key={u.uid || u.email} value={u.uid || u.email}>
                    {u.displayName || u.email} {u.role === 'admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION 1: ASSIGNED TASK ANALYTICS
           ========================================================================= */}
        <section className="analytics-section">
          <div className="section-header-block">
            <span className="section-badge assigned-badge">
              <FiLayers size={12} style={{ marginRight: 5 }} />
              {isAdmin && !selectedEmployee ? 'COMPANY ASSIGNED WORK' : 'ASSIGNED TASKS'}
            </span>
            <h2 className="section-title">
              {isAdmin
                ? selectedEmployee
                  ? `${selectedEmployeeName}'s Assigned Tasks`
                  : 'Team Assigned Task Analytics'
                : 'My Assigned Tasks'}
            </h2>
            <p className="section-subtitle">
              Track progress on tasks assigned by the founder or administrators.
            </p>
          </div>

          {/* KPI Cards (6 metrics) */}
          <div className="stats-grid kpi-grid-6">
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/tasks')}
              title="View all assigned tasks"
            >
              <div className="stat-header">
                <div className="stat-icon primary"><FiLayers /></div>
                <span className="stat-label">Total Assigned</span>
              </div>
              <div className="stat-value">{assigned.totalTasks}</div>
              <div className="stat-change">Assigned company tasks</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/tasks?status=completed')}
              title="View completed assigned tasks"
            >
              <div className="stat-header">
                <div className="stat-icon success"><FiCheckCircle /></div>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {assigned.completedTasks}
              </div>
              <div className="stat-change">Finished successfully</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/tasks?status=in-progress')}
              title="View in-progress assigned tasks"
            >
              <div className="stat-header">
                <div className="stat-icon warning"><FiZap /></div>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-value" style={{ color: '#0284C7' }}>
                {assigned.inProgressTasks}
              </div>
              <div className="stat-change">Currently underway</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/tasks?status=todo')}
              title="View pending assigned tasks"
            >
              <div className="stat-header">
                <div className="stat-icon warning"><FiClock /></div>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {assigned.pendingTasks}
              </div>
              <div className="stat-change">Awaiting commencement</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon danger"><FiAlertCircle /></div>
                <span className="stat-label">Overdue</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {assigned.overdueTasks}
              </div>
              <div className="stat-change">Past target due date</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon info"><FiTarget /></div>
                <span className="stat-label">Completion Rate</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {assigned.completionRate}%
              </div>
              <div className="stat-change">Assigned tasks completed</div>
            </div>
          </div>

          {/* Charts Row: Trend & Donut */}
          <div className="analytics-chart-row">
            {/* Chart A: Assigned Task Completion Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Assigned Task Completion Trend</h3>
                <span className="chart-tag">{period.toUpperCase()}</span>
              </div>
              <p className="chart-subtitle">
                Comparison of assigned tasks created vs completed across the selected period.
              </p>
              {assigned.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={assigned.trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="created"
                      name="Assigned Tasks"
                      stroke="#015987"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#015987' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed Tasks"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#16A34A' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <p>No assigned task data for this period</p>
                </div>
              )}
            </div>

            {/* Chart B: Assigned Task Status Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Assigned Status Distribution</h3>
                <span className="chart-tag">DONUT</span>
              </div>
              <p className="chart-subtitle">Breakdown by current workflow status.</p>
              {assigned.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={assigned.statusData}
                      cx="50%"
                      cy="48%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#64748B', strokeWidth: 1 }}
                    >
                      {assigned.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <p>No assigned tasks to visualize</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart C: Priority Bar Chart & Details Table */}
          <div className="analytics-chart-row" style={{ marginTop: 'var(--space-5)' }}>
            {/* Chart C: Priority */}
            <div className="chart-card" style={{ flex: '1 1 340px' }}>
              <div className="chart-header">
                <h3>Assigned Task Priority</h3>
                <span className="chart-tag">PRIORITY</span>
              </div>
              <p className="chart-subtitle">Distribution of tasks by urgency level.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={assigned.priorityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tasks" radius={[5, 5, 0, 0]}>
                    {assigned.priorityData.map((entry, index) => (
                      <Cell key={`priority-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart D: Assigned Task Details Table */}
            <div className="chart-card" style={{ flex: '2 1 540px' }}>
              <div className="chart-header">
                <h3>Assigned Task Details</h3>
                <span className="chart-tag">{assigned.taskDetails.length} TASKS</span>
              </div>
              <p className="chart-subtitle">Recent records of company-assigned assignments.</p>
              <div className="table-responsive-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Assignee</th>
                      <th>Assigned By</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigned.taskDetails.slice(0, 8).map(task => {
                      const priority = getPriorityInfo(task.priority);
                      const status = getStatusInfo(task.status);
                      const overdue = isTaskOverdue(task);
                      return (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 500, maxWidth: 220 }}>
                            <div className="truncate-text" title={task.title}>{task.title}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px' }}>
                              {task.assignedToName || task.assignedToEmail || 'Team'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {task.createdByName || 'Founder'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: overdue ? 600 : 400 }}>
                              {task.dueDate ? formatTaskDate(task.dueDate) : '—'}
                            </span>
                          </td>
                          <td>
                            <span
                              className="task-badge priority-badge"
                              style={{ backgroundColor: priority.bg, color: priority.color, borderColor: priority.border }}
                            >
                              {priority.label}
                            </span>
                          </td>
                          <td>
                            <span className={`task-badge ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {assigned.taskDetails.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No assigned tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Founder/Admin View: Individual Employee Breakdown Table */}
          {isAdmin && !selectedEmployee && assigned.employeeStats.length > 0 && (
            <div className="chart-card" style={{ marginTop: 'var(--space-5)' }}>
              <div className="chart-header">
                <h3>Employee Assigned Work Performance</h3>
                <span className="chart-tag">TEAM DISTRIBUTION</span>
              </div>
              <p className="chart-subtitle">
                Individual employee completion rates and workload for assigned tasks.
              </p>
              <div className="table-responsive-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Total Assigned</th>
                      <th>Completed</th>
                      <th>In Progress</th>
                      <th>Pending</th>
                      <th>Overdue</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigned.employeeStats.map(emp => (
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
                        <td style={{ fontWeight: 600 }}>{emp.total}</td>
                        <td style={{ color: 'var(--success)' }}>{emp.completed}</td>
                        <td style={{ color: '#0284C7' }}>{emp.inProgress}</td>
                        <td style={{ color: 'var(--warning)' }}>{emp.pending}</td>
                        <td style={{ color: emp.overdue > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: emp.overdue > 0 ? 600 : 400 }}>
                          {emp.overdue}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-bar-bg" style={{ width: '90px' }}>
                              <div className="progress-bar-fill" style={{ width: `${emp.rate}%` }}></div>
                            </div>
                            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {emp.rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            SUBTLE SECTION DIVIDER
           ========================================================================= */}
        <div className="analytics-section-divider">
          <div className="divider-line"></div>
          <span className="divider-label">
            <FiList style={{ marginRight: 6 }} /> SEPARATE PRODUCTIVITY DATASETS
          </span>
          <div className="divider-line"></div>
        </div>

        {/* =========================================================================
            SECTION 2: PERSONAL TO-DO ANALYTICS
           ========================================================================= */}
        <section className="analytics-section">
          <div className="section-header-block">
            <span className="section-badge personal-badge">
              <FiList size={12} style={{ marginRight: 5 }} />
              PERSONAL PRODUCTIVITY
            </span>
            <h2 className="section-title">
              {isAdmin
                ? selectedEmployee
                  ? `${selectedEmployeeName}'s Personal To-Dos`
                  : 'Personal To-Do Analytics'
                : 'My Personal To-Do'}
            </h2>
            <p className="section-subtitle">
              Measure progress on tasks you create for yourself.
            </p>
          </div>

          {/* KPI Cards (6 metrics for Personal) */}
          <div className="stats-grid kpi-grid-6">
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/personal-todos')}
              title="View personal to-dos"
            >
              <div className="stat-header">
                <div className="stat-icon primary"><FiList /></div>
                <span className="stat-label">Total Personal</span>
              </div>
              <div className="stat-value">{personal.totalTasks}</div>
              <div className="stat-change">Personal to-do items</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/personal-todos')}
              title="View completed to-dos"
            >
              <div className="stat-header">
                <div className="stat-icon success"><FiCheckCircle /></div>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {personal.completedTasks}
              </div>
              <div className="stat-change">Personal items done</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/personal-todos')}
              title="View in-progress personal to-dos"
            >
              <div className="stat-header">
                <div className="stat-icon warning"><FiZap /></div>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-value" style={{ color: '#0284C7' }}>
                {personal.inProgressTasks}
              </div>
              <div className="stat-change">Underway by self</div>
            </div>

            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/personal-todos')}
              title="View pending personal to-dos"
            >
              <div className="stat-header">
                <div className="stat-icon warning"><FiClock /></div>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {personal.pendingTasks}
              </div>
              <div className="stat-change">To be tackled</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon danger"><FiAlertCircle /></div>
                <span className="stat-label">Overdue</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {personal.overdueTasks}
              </div>
              <div className="stat-change">Past personal target</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon info"><FiTarget /></div>
                <span className="stat-label">Personal Rate</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {personal.completionRate}%
              </div>
              <div className="stat-change">Personal completion rate</div>
            </div>
          </div>

          {/* Charts Row: Trend & Donut for Personal */}
          <div className="analytics-chart-row">
            {/* Chart A: Personal Productivity Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Personal Productivity Trend</h3>
                <span className="chart-tag">{period.toUpperCase()}</span>
              </div>
              <p className="chart-subtitle">
                Personal tasks created and completed over the selected period.
              </p>
              {personal.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={personal.trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="created"
                      name="Personal Created"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8B5CF6' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Personal Completed"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#16A34A' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <p>No personal to-do activity in this period</p>
                </div>
              )}
            </div>

            {/* Chart B: Personal To-Do Status Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Personal Status Distribution</h3>
                <span className="chart-tag">DONUT</span>
              </div>
              <p className="chart-subtitle">Breakdown of personal items by status.</p>
              {personal.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={personal.statusData}
                      cx="50%"
                      cy="48%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#64748B', strokeWidth: 1 }}
                    >
                      {personal.statusData.map((entry, index) => (
                        <Cell key={`personal-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <p>No personal to-dos to visualize</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart C & D: Priority and Summary Table for Personal */}
          <div className="analytics-chart-row" style={{ marginTop: 'var(--space-5)' }}>
            {/* Chart C: Priority */}
            <div className="chart-card" style={{ flex: '1 1 340px' }}>
              <div className="chart-header">
                <h3>Personal Task Priority</h3>
                <span className="chart-tag">PRIORITY</span>
              </div>
              <p className="chart-subtitle">Distribution of personal tasks by priority.</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={personal.priorityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Personal Tasks" radius={[5, 5, 0, 0]}>
                    {personal.priorityData.map((entry, index) => (
                      <Cell key={`pers-pri-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart D: Personal To-Do List Summary Table */}
            <div className="chart-card" style={{ flex: '2 1 540px' }}>
              <div className="chart-header">
                <h3>Personal To-Do List Summary</h3>
                <span className="chart-tag">{personal.taskDetails.length} ITEMS</span>
              </div>
              <p className="chart-subtitle">Personal tasks created for individual productivity.</p>
              <div className="table-responsive-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Created Date</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personal.taskDetails.slice(0, 8).map(task => {
                      const priority = getPriorityInfo(task.priority);
                      const status = getStatusInfo(task.status);
                      const overdue = isTaskOverdue(task);
                      return (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 500, maxWidth: 220 }}>
                            <div className="truncate-text" title={task.title}>{task.title}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {formatTaskDate(task.createdAt)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: overdue ? 600 : 400 }}>
                              {task.dueDate ? formatTaskDate(task.dueDate) : '—'}
                            </span>
                          </td>
                          <td>
                            <span
                              className="task-badge priority-badge"
                              style={{ backgroundColor: priority.bg, color: priority.color, borderColor: priority.border }}
                            >
                              {priority.label}
                            </span>
                          </td>
                          <td>
                            <span className={`task-badge ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {task.completedAt ? formatTaskDate(task.completedAt) : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {personal.taskDetails.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No personal to-do items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

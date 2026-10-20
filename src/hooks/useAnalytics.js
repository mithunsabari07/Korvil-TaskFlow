import { useMemo } from 'react';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  parseISO,
  isBefore,
} from 'date-fns';
import { isPersonalTask, isTaskOverdue } from '../utils/permissions';

/**
 * Safely parse a date from Firestore Timestamp, ISO string, or Date object
 */
function toDate(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val.toMillis === 'function') return new Date(val.toMillis());
  if (val instanceof Date) return val;
  try {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Build analytics dataset for a specific task subset (Assigned or Personal)
 */
function buildTaskAnalytics(taskList, interval, datePoints, users = [], isPersonal = false) {
  const { startDate, endDate } = interval;

  // Total dataset
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter(t => t.status === 'completed').length;
  const overdueTasks = taskList.filter(t => isTaskOverdue(t)).length;
  // Non-overdue in-progress and pending
  const inProgressTasks = taskList.filter(t => t.status === 'in-progress' && !isTaskOverdue(t)).length;
  const pendingTasks = taskList.filter(t => t.status === 'todo' && !isTaskOverdue(t)).length;

  // Independent Completion Rate calculation
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status Distribution Donut Chart Data
  // Each task is counted in exactly one category
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#16A34A' },
    { name: 'In Progress', value: inProgressTasks, color: '#0284C7' },
    { name: 'Pending', value: pendingTasks, color: '#D97706' },
    { name: 'Overdue', value: overdueTasks, color: '#DC2626' },
  ].filter(d => d.value > 0);

  // Priority Bar Chart Data (Low, Medium, High, Urgent)
  const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
  taskList.forEach(t => {
    const p = (t.priority || 'medium').toLowerCase();
    if (priorityCounts[p] !== undefined) {
      priorityCounts[p]++;
    } else {
      priorityCounts.medium++;
    }
  });

  const priorityData = [
    { name: 'Low', count: priorityCounts.low, fill: '#059669' },
    { name: 'Medium', count: priorityCounts.medium, fill: '#015987' },
    { name: 'High', count: priorityCounts.high, fill: '#EA580C' },
    { name: 'Urgent', count: priorityCounts.urgent, fill: '#DC2626' },
  ];

  // Trend Chart Data (Line chart over the reporting period)
  const trendData = datePoints.map(point => {
    const createdCount = taskList.filter(t => {
      const d = toDate(t.createdAt);
      return d && isWithinInterval(d, { start: point.start, end: point.end });
    }).length;

    const completedCount = taskList.filter(t => {
      if (t.status !== 'completed') return false;
      const d = toDate(t.completedAt) || toDate(t.updatedAt) || toDate(t.createdAt);
      return d && isWithinInterval(d, { start: point.start, end: point.end });
    }).length;

    return {
      name: point.label,
      fullDate: point.fullDate,
      created: createdCount,
      completed: completedCount,
    };
  });

  // Employee breakdown for Team views
  const employeeStats = users.map(user => {
    const uUid = user.uid;
    const uEmail = user.email?.toLowerCase();

    const userTasks = taskList.filter(t => 
      t.assignedTo === uUid ||
      t.assignedTo?.toLowerCase() === uEmail ||
      t.assignedToEmail?.toLowerCase() === uEmail ||
      (isPersonal && t.createdBy === uUid)
    );

    const userCompleted = userTasks.filter(t => t.status === 'completed').length;
    const userOverdue = userTasks.filter(t => isTaskOverdue(t)).length;
    const userInProgress = userTasks.filter(t => t.status === 'in-progress' && !isTaskOverdue(t)).length;
    const userPending = userTasks.filter(t => t.status === 'todo' && !isTaskOverdue(t)).length;
    const userRate = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;

    return {
      uid: user.uid,
      name: user.displayName || user.email,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      total: userTasks.length,
      completed: userCompleted,
      inProgress: userInProgress,
      pending: userPending,
      overdue: userOverdue,
      rate: userRate,
    };
  }).filter(e => e.total > 0 || users.length <= 10).sort((a, b) => b.total - a.total);

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
    statusData,
    priorityData,
    trendData,
    taskDetails: taskList,
    employeeStats,
  };
}

/**
 * Compute independent analytics data for both Assigned Tasks and Personal To-Dos
 * @param {Array} tasks - Raw array of task objects from Firestore
 * @param {string} period - 'daily' | 'weekly' | 'monthly' | 'custom'
 * @param {Array} users - Array of team members
 * @param {Object} customRange - { startDate: Date|string, endDate: Date|string }
 * @returns {Object} { assigned: Object, personal: Object }
 */
export function useAnalytics(tasks = [], period = 'weekly', users = [], customRange = null) {
  return useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    // Determine interval
    switch (period) {
      case 'daily':
        startDate = subDays(startOfDay(now), 6); // Last 7 days
        endDate = endOfDay(now);
        break;
      case 'weekly':
        startDate = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3); // Last 4 weeks
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = subMonths(startOfMonth(now), 5); // Last 6 months
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (customRange?.startDate && customRange?.endDate) {
          const s = typeof customRange.startDate === 'string' ? parseISO(customRange.startDate) : customRange.startDate;
          const e = typeof customRange.endDate === 'string' ? parseISO(customRange.endDate) : customRange.endDate;
          startDate = startOfDay(s);
          endDate = endOfDay(e);
        } else {
          startDate = subDays(startOfDay(now), 29); // Last 30 days default
          endDate = endOfDay(now);
        }
        break;
      default:
        startDate = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3);
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    // Generate date points for trend charts
    let datePoints = [];
    if (period === 'daily') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      datePoints = days.map(day => ({
        label: format(day, 'EEE'),
        fullDate: format(day, 'MMM dd, yyyy'),
        start: startOfDay(day),
        end: endOfDay(day),
      }));
    } else if (period === 'weekly') {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      datePoints = weeks.map((weekStart, i) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          label: `Wk ${i + 1}`,
          fullDate: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
          start: weekStart,
          end: weekEnd,
        };
      });
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(now, i));
        const mEnd = endOfMonth(subMonths(now, i));
        datePoints.push({
          label: format(mStart, 'MMM'),
          fullDate: format(mStart, 'MMMM yyyy'),
          start: mStart,
          end: mEnd,
        });
      }
    } else {
      // Custom date range: generate appropriate intervals
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 14) {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        datePoints = days.map(day => ({
          label: format(day, 'MMM dd'),
          fullDate: format(day, 'MMM dd, yyyy'),
          start: startOfDay(day),
          end: endOfDay(day),
        }));
      } else {
        const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        datePoints = weeks.map((weekStart, i) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          return {
            label: `Wk ${i + 1}`,
            fullDate: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
            start: weekStart,
            end: weekEnd,
          };
        });
      }
    }

    const interval = { startDate, endDate };

    // Separate datasets strictly
    const assignedTasks = tasks.filter(t => !isPersonalTask(t));
    const personalTasks = tasks.filter(t => isPersonalTask(t));

    const assignedAnalytics = buildTaskAnalytics(assignedTasks, interval, datePoints, users, false);
    const personalAnalytics = buildTaskAnalytics(personalTasks, interval, datePoints, users, true);

    return {
      assigned: assignedAnalytics,
      personal: personalAnalytics,
      dateRange: { startDate, endDate },
    };
  }, [tasks, period, users, customRange]);
}

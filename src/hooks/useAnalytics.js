import { useMemo } from 'react';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  isAfter,
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
} from 'date-fns';

/**
 * Compute analytics data from tasks
 * @param {Array} tasks - Array of task objects
 * @param {string} period - 'daily' | 'weekly' | 'monthly'
 * @param {Array} users - Array of user objects (for admin view)
 * @returns {Object} analytics data
 */
export function useAnalytics(tasks, period = 'weekly', users = []) {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completionRate: 0,
        chartData: [],
        employeeStats: [],
      };
    }

    const now = new Date();
    let startDate, endDate;

    // Determine date range
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
      default:
        startDate = subDays(startOfDay(now), 6);
        endDate = endOfDay(now);
    }

    // Filter tasks within period
    const filteredTasks = tasks.filter(task => {
      const taskDate = task.createdAt?.toDate?.() || new Date(task.createdAt);
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });

    // Overall stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Generate chart data based on period
    let chartData = [];
    
    if (period === 'daily') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      chartData = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const assigned = tasks.filter(t => {
          const d = t.createdAt?.toDate?.() || new Date(t.createdAt);
          return isWithinInterval(d, { start: dayStart, end: dayEnd });
        }).length;
        
        const completed = tasks.filter(t => {
          if (t.status !== 'completed' || !t.completedAt) return false;
          const d = t.completedAt?.toDate?.() || new Date(t.completedAt);
          return isWithinInterval(d, { start: dayStart, end: dayEnd });
        }).length;
        
        return {
          name: format(day, 'EEE'),
          fullDate: format(day, 'MMM dd'),
          assigned,
          completed,
        };
      });
    } else if (period === 'weekly') {
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );
      chartData = weeks.map((weekStart, i) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const assigned = tasks.filter(t => {
          const d = t.createdAt?.toDate?.() || new Date(t.createdAt);
          return isWithinInterval(d, { start: weekStart, end: weekEnd });
        }).length;
        
        const completed = tasks.filter(t => {
          if (t.status !== 'completed' || !t.completedAt) return false;
          const d = t.completedAt?.toDate?.() || new Date(t.completedAt);
          return isWithinInterval(d, { start: weekStart, end: weekEnd });
        }).length;
        
        return {
          name: `Week ${i + 1}`,
          fullDate: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
          assigned,
          completed,
        };
      });
    } else {
      // Monthly
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const assigned = tasks.filter(t => {
          const d = t.createdAt?.toDate?.() || new Date(t.createdAt);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        }).length;
        
        const completed = tasks.filter(t => {
          if (t.status !== 'completed' || !t.completedAt) return false;
          const d = t.completedAt?.toDate?.() || new Date(t.completedAt);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        }).length;
        
        chartData.push({
          name: format(monthStart, 'MMM'),
          fullDate: format(monthStart, 'MMMM yyyy'),
          assigned,
          completed,
        });
      }
    }

    // Employee breakdown stats (for admin view)
    const employeeStats = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.uid);
      const userCompleted = userTasks.filter(t => t.status === 'completed').length;
      const userPending = userTasks.filter(t => t.status === 'todo').length;
      const userInProgress = userTasks.filter(t => t.status === 'in-progress').length;
      
      return {
        uid: user.uid,
        name: user.displayName || user.email,
        email: user.email,
        photoURL: user.photoURL,
        total: userTasks.length,
        completed: userCompleted,
        pending: userPending,
        inProgress: userInProgress,
        rate: userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate,
      chartData,
      employeeStats,
    };
  }, [tasks, period, users]);
}

/**
 * Permission utility functions for role-based access control
 */

/**
 * Check if user can edit a task
 * - Admin can edit any task
 * - Employee can edit tasks they created (personal todos)
 * - Employee CANNOT edit tasks assigned by admin/founder
 */
export function canEditTask(userProfile, task) {
  if (!userProfile || !task) return false;
  
  // Admin / Founder can edit any task
  if (userProfile.role === 'admin') return true;
  
  // If founder created it, ONLY founder can edit it
  if (task.createdByRole === 'admin') return false;

  // If employee created it, the employee who created it can edit it
  return task.createdBy === userProfile.uid;
}

/**
 * Check if user can delete a task
 * - Admin can delete any task
 * - Employee can delete only tasks they created
 * - Employee CANNOT delete tasks created by admin/founder
 */
export function canDeleteTask(userProfile, task) {
  if (!userProfile || !task) return false;
  
  // Admin / Founder can delete any task
  if (userProfile.role === 'admin') return true;
  
  // Employee can NEVER delete founder tasks
  if (task.createdByRole === 'admin') return false;

  // Employee can only delete tasks they created
  return task.createdBy === userProfile.uid;
}

/**
 * Check if user can mark task as complete/incomplete
 * Everyone who is assigned the task or created it can toggle status
 */
export function canToggleTask(userProfile, task) {
  if (!userProfile || !task) return false;
  
  // Admin can toggle any task
  if (userProfile.role === 'admin') return true;
  
  const myUid = userProfile.uid;
  const myEmail = userProfile.email?.toLowerCase();

  // Task is assigned to this user (by UID or email)
  if (task.assignedTo === myUid) return true;
  if (task.assignedTo?.toLowerCase() === myEmail) return true;
  if (task.assignedToEmail?.toLowerCase() === myEmail) return true;
  
  // User created the task
  if (task.createdBy === myUid) return true;
  
  return false;
}

/**
 * Check if user can assign tasks to others
 * Only admins can assign tasks
 */
export function canAssignTasks(userProfile) {
  return userProfile?.role === 'admin';
}

/**
 * Check if user can manage employees
 * Only admins can manage employees
 */
export function canManageUsers(userProfile) {
  return userProfile?.role === 'admin';
}

/**
 * Check if user can manage admin roles
 * Only the primary admin can add/remove admins
 */
export function canManageAdmins(userProfile, primaryAdminEmail) {
  return userProfile?.email === primaryAdminEmail;
}

/**
 * Get task status display info
 */
export function getStatusInfo(status) {
  switch (status) {
    case 'todo':
      return { label: 'To Do', className: 'todo', color: '#0284C7' };
    case 'in-progress':
      return { label: 'In Progress', className: 'in-progress', color: '#D97706' };
    case 'completed':
      return { label: 'Completed', className: 'completed', color: '#16A34A' };
    default:
      return { label: status, className: '', color: '#64748B' };
  }
}

/**
 * Get task priority display info
 */
export function getPriorityInfo(priority = 'medium') {
  const p = (priority || 'medium').toLowerCase();
  switch (p) {
    case 'urgent':
      return { label: 'Urgent', key: 'urgent', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', border: '#FCA5A5' };
    case 'high':
      return { label: 'High', key: 'high', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.12)', border: '#FDBA74' };
    case 'medium':
      return { label: 'Medium', key: 'medium', color: '#015987', bg: 'rgba(1, 89, 135, 0.1)', border: '#93C5FD' };
    case 'low':
      return { label: 'Low', key: 'low', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: '#86EFAC' };
    default:
      return { label: 'Medium', key: 'medium', color: '#015987', bg: 'rgba(1, 89, 135, 0.1)', border: '#93C5FD' };
  }
}

/**
 * Check if a task is overdue
 * Completed tasks are NEVER overdue
 */
export function isTaskOverdue(task) {
  if (!task || task.status === 'completed' || !task.dueDate) return false;
  try {
    const due = new Date(task.dueDate);
    if (isNaN(due.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  } catch {
    return false;
  }
}

/**
 * Check if a task is classified as a personal to-do
 */
export function isPersonalTask(task) {
  if (!task) return false;
  return Boolean(task.isPersonalTodo || task.taskType === 'personal');
}

/**
 * Check if user can review work submissions (Founder or Admin)
 */
export function canReviewSubmissions(userProfile) {
  if (!userProfile) return false;
  const email = userProfile.email?.toLowerCase();
  return (
    userProfile.role === 'admin' ||
    email === 'janaganmeenambikai@gmail.com' ||
    email === 'mithunsabari.rms@gmail.com'
  );
}

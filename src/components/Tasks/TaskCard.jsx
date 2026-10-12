import { useState } from 'react';
import { FiCheck, FiEdit2, FiTrash2, FiUser, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { canEditTask, canDeleteTask, canToggleTask, getStatusInfo } from '../../utils/permissions';

export default function TaskCard({ task, onEdit, onDelete, onToggle, onStatusChange }) {
  const { userProfile } = useAuth();
  const isCompleted = task.status === 'completed';
  const statusInfo = getStatusInfo(task.status);

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''}`}>
      {/* Checkbox */}
      {canToggleTask(userProfile, task) && (
        <button
          className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={() => onToggle(task.id, task.status)}
          title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          {isCompleted && <FiCheck size={14} />}
        </button>
      )}

      {/* Task Content */}
      <div className="task-card-content">
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
        <div className="task-meta">
          <span className={`task-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {task.isPersonalTodo ? (
            <span className="task-badge personal">✦ Personal</span>
          ) : userProfile?.role === 'admin' ? (
            <span
              className="task-badge assigned"
              title={`Created by ${task.createdByName || 'Admin'}`}
            >
              <FiUser size={11} style={{ marginRight: 2 }} />
              Assigned to: <strong style={{ marginLeft: 3, color: 'var(--text-primary)' }}>{task.assignedToName || task.assignedToEmail || 'Team'}</strong>
            </span>
          ) : (
            <span className="task-badge assigned">
              <FiUser size={11} style={{ marginRight: 2 }} />
              Assigned by: <strong style={{ marginLeft: 3, color: 'var(--text-primary)' }}>{task.createdByName || 'Founder'}</strong>
            </span>
          )}
          <span className="task-assigned-by">
            <FiClock size={10} style={{ marginRight: 4 }} />
            {formatDate(task.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="task-card-actions">
        {/* Status dropdown */}
        {canToggleTask(userProfile, task) && (
          <select
            className="form-select"
            style={{
              width: 'auto',
              padding: '4px 28px 4px 8px',
              fontSize: 'var(--font-xs)',
              minWidth: '100px',
            }}
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}
        
        {canEditTask(userProfile, task) && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            <FiEdit2 size={14} />
          </button>
        )}
        {canDeleteTask(userProfile, task) && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onDelete(task)}
            title="Delete task"
            style={{ color: 'var(--danger)' }}
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

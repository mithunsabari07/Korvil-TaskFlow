import { useState } from 'react';
import { FiCheck, FiEdit2, FiTrash2, FiUser, FiClock, FiCalendar, FiAlertCircle, FiFileText, FiUploadCloud } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { canEditTask, canDeleteTask, canToggleTask, getStatusInfo, getPriorityInfo, isTaskOverdue } from '../../utils/permissions';

export default function TaskCard({ task, onEdit, onDelete, onToggle, onStatusChange, onViewSubmission, onSubmitDeliverable }) {
  const { userProfile } = useAuth();
  const isCompleted = task.status === 'completed';
  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const overdue = isTaskOverdue(task);

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDueDate(dueStr) {
    if (!dueStr) return null;
    try {
      if (typeof dueStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueStr)) {
        const [year, month, day] = dueStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      const d = dueStr.toDate ? dueStr.toDate() : new Date(dueStr);
      if (isNaN(d.getTime())) return dueStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dueStr;
    }
  }

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''} ${overdue ? 'task-card-overdue' : ''}`}>
      <div className="task-card-main">
        {/* Checkbox */}
        {canToggleTask(userProfile, task) && (
          <button
            type="button"
            className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
            onClick={() => onToggle(task.id, task.status)}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted && <FiCheck size={14} />}
          </button>
        )}

        {/* Task Content */}
        <div className="task-card-content">
          <div className="task-title-row">
            <span className="task-title">{task.title}</span>
          </div>
          {task.description && (
            <div className="task-description">{task.description}</div>
          )}
          <div className="task-meta">
            <span className={`task-badge ${statusInfo.className}`}>
              {statusInfo.label}
            </span>

            {/* Priority Badge */}
            <span
              className="task-badge priority-badge"
              style={{
                backgroundColor: priorityInfo.bg,
                color: priorityInfo.color,
                borderColor: priorityInfo.border,
              }}
              title={`Priority: ${priorityInfo.label}`}
            >
              {priorityInfo.label}
            </span>

            {/* Due Date & Overdue Badge */}
            {task.dueDate && (
              <span
                className={`task-badge due-badge ${overdue ? 'overdue' : ''}`}
                title={overdue ? 'Task is overdue!' : `Due on ${task.dueDate}`}
              >
                {overdue ? <FiAlertCircle size={11} style={{ marginRight: 3 }} /> : <FiCalendar size={11} style={{ marginRight: 3 }} />}
                {overdue ? `Overdue: ${formatDueDate(task.dueDate)}` : `Due: ${formatDueDate(task.dueDate)}`}
              </span>
            )}

            {/* Submission Indicator */}
            {task.hasSubmission && (
              <span
                className="task-badge submission-badge"
                style={{ cursor: onViewSubmission ? 'pointer' : 'default' }}
                onClick={() => onViewSubmission && onViewSubmission(task)}
                title="Work document submitted"
              >
                <FiFileText size={11} style={{ marginRight: 3 }} />
                {task.submissionStatus === 'approved' ? 'Doc Approved' : 'Doc Submitted'}
              </span>
            )}

            {task.isPersonalTodo ? (
              <span className="task-badge personal">✦ Personal</span>
            ) : userProfile?.role === 'admin' ? (
              <span
                className="task-badge assigned"
                title={`Created by ${task.createdByName || 'Admin'}`}
              >
                <FiUser size={11} style={{ marginRight: 2 }} />
                Assigned to:{' '}
                {task.assignedToEmail ? (
                  <a
                    href={`mailto:${task.assignedToEmail}`}
                    className="email-link"
                    style={{ marginLeft: 3, fontWeight: 600, color: 'var(--text-primary)' }}
                    title={`Email ${task.assignedToEmail}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.assignedToName || task.assignedToEmail}
                  </a>
                ) : (
                  <strong style={{ marginLeft: 3, color: 'var(--text-primary)' }}>
                    {task.assignedToName || 'Team'}
                  </strong>
                )}
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
      </div>

      {/* Actions */}
      <div className="task-card-actions">
        {/* Status dropdown */}
        {canToggleTask(userProfile, task) && (
          <select
            className="form-select task-status-select"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            aria-label="Change task status"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}

        {/* Submit Deliverable / View Deliverable button for assigned tasks */}
        {!task.isPersonalTodo && (
          <button
            type="button"
            className={`btn btn-sm ${task.hasSubmission ? 'btn-secondary' : isCompleted ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 'var(--font-xs)',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onClick={() => {
              if (onSubmitDeliverable) {
                onSubmitDeliverable(task);
              } else if (onViewSubmission) {
                onViewSubmission(task);
              }
            }}
            title={task.hasSubmission ? 'View or revise submitted deliverable' : 'Upload work deliverable (PDF)'}
          >
            <FiUploadCloud size={13} />
            <span>{task.hasSubmission ? 'Deliverable' : 'Submit Work'}</span>
          </button>
        )}
        
        {canEditTask(userProfile, task) && (
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label="Edit task"
          >
            <FiEdit2 size={14} />
          </button>
        )}
        {canDeleteTask(userProfile, task) && (
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onDelete(task)}
            title="Delete task"
            aria-label="Delete task"
            style={{ color: 'var(--danger)' }}
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

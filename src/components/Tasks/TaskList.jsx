import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiUploadCloud, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useToast } from '../../contexts/ToastContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import ConfirmDialog from '../Common/ConfirmDialog';
import TaskDeliverableModal from '../WorkSubmissions/TaskDeliverableModal';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function TaskList() {
  useDocumentTitle('Tasks', 'View, track, and update assigned team tasks and deliverable milestones.');
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();
  const { tasks, loading, createTask, updateTask, toggleTaskStatus, changeTaskStatus, deleteTask } = useTasks();
  const { users } = useUsers();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deliverableTask, setDeliverableTask] = useState(null);
  const [completionPromptTask, setCompletionPromptTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && ['all', 'todo', 'in-progress', 'completed'].includes(s)) {
      setStatusFilter(s);
    } else if (!s) {
      setStatusFilter('all');
    }
  }, [searchParams]);

  function handleStatusFilterChange(val) {
    setStatusFilter(val);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      if (val === 'all') {
        updated.delete('status');
      } else {
        updated.set('status', val);
      }
      return updated;
    });
  }

  // Filter out personal todos — they have their own page
  const workTasks = useMemo(() => {
    return tasks.filter(t => !t.isPersonalTodo);
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let filtered = workTasks;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Assignee filter (admin only)
    if (assigneeFilter !== 'all') {
      const filterLower = assigneeFilter.toLowerCase();
      filtered = filtered.filter(t => 
        t.assignedTo === assigneeFilter ||
        t.assignedTo?.toLowerCase() === filterLower ||
        t.assignedToEmail?.toLowerCase() === filterLower
      );
    }

    return filtered;
  }, [workTasks, searchQuery, statusFilter, assigneeFilter]);

  // Group tasks by status
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  async function handleCreateTask(data) {
    await createTask(data);
    toast.success('Task created successfully!');
  }

  async function handleUpdateTask(data) {
    await updateTask(editingTask.id, data);
    setEditingTask(null);
    toast.success('Task updated!');
  }

  async function handleDeleteTask() {
    await deleteTask(deletingTask.id);
    setDeletingTask(null);
    toast.success('Task deleted');
  }

  async function handleToggle(taskId, currentStatus) {
    const task = tasks.find(t => t.id === taskId);
    await toggleTaskStatus(taskId, currentStatus);
    // If marking as completed, offer optional deliverable PDF upload for assigned work
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

  function renderTaskGroup(title, taskList, emoji) {
    if (taskList.length === 0) return null;
    return (
      <div className="task-section">
        <div className="task-section-header">
          <h2>
            {emoji} {title}
            <span className="task-count">{taskList.length}</span>
          </h2>
        </div>
        {taskList.map((task, i) => (
          <div key={task.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <TaskCard
              task={task}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
              onToggle={handleToggle}
              onStatusChange={handleStatusChange}
              onViewSubmission={() => navigate('/work-submissions')}
              onSubmitDeliverable={(t) => setDeliverableTask(t)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="header-subtitle">
            {isAdmin
              ? `${workTasks.length} total tasks across team`
              : `${workTasks.length} tasks assigned to you`}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <FiPlus /> {isAdmin ? 'Assign Task' : 'Add Task'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {isAdmin && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">All Members</option>
              {users.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Task Groups */}
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No tasks found</h3>
            <p>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : isAdmin
                ? 'Create your first task by clicking "Assign Task"'
                : 'No tasks assigned to you yet'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <FiPlus /> Create Task
              </button>
            )}
          </div>
        ) : (
          <>
            {renderTaskGroup('To Do', todoTasks, '📝')}
            {renderTaskGroup('In Progress', inProgressTasks, '⚡')}
            {renderTaskGroup('Completed', completedTasks, '✅')}
          </>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingTask && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingTask.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteTask}
          onCancel={() => setDeletingTask(null)}
        />
      )}

      {/* Optional Completion Deliverable Prompt Modal */}
      {completionPromptTask && (
        <div className="modal-overlay" onClick={() => setCompletionPromptTask(null)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>🎉</span>
                <h3>Task Completed!</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setCompletionPromptTask(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                "{completionPromptTask.title}" is now marked as complete.
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
    </>
  );
}

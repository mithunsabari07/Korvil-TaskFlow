import { useState, useMemo } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../contexts/ToastContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import ConfirmDialog from '../Common/ConfirmDialog';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function PersonalTodos() {
  useDocumentTitle('Personal To-Dos', 'Manage individual to-do items and personal productivity goals.');
  const { userProfile, isAdmin } = useAuth();
  const { tasks, loading, createTask, updateTask, toggleTaskStatus, changeTaskStatus, deleteTask } = useTasks();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState('');

  // Filter personal todos
  const personalTodos = useMemo(() => {
    let filtered = tasks.filter(t => t.isPersonalTodo);
    
    // Admin can view specific employee's personal todos
    if (isAdmin && viewingEmployee) {
      filtered = filtered.filter(t => t.assignedTo === viewingEmployee);
    } else if (!isAdmin) {
      filtered = filtered.filter(t => t.assignedTo === userProfile?.uid);
    }

    return filtered;
  }, [tasks, isAdmin, viewingEmployee, userProfile]);

  const todoTasks = personalTodos.filter(t => t.status === 'todo');
  const inProgressTasks = personalTodos.filter(t => t.status === 'in-progress');
  const completedTasks = personalTodos.filter(t => t.status === 'completed');

  // Get unique employees who have personal todos
  const employeesWithTodos = useMemo(() => {
    if (!isAdmin) return [];
    const unique = new Map();
    tasks
      .filter(t => t.isPersonalTodo)
      .forEach(t => {
        if (!unique.has(t.assignedTo)) {
          unique.set(t.assignedTo, t.assignedToName);
        }
      });
    return Array.from(unique.entries()).map(([uid, name]) => ({ uid, name }));
  }, [tasks, isAdmin]);

  async function handleCreate(data) {
    await createTask({ ...data, isPersonalTodo: true });
    toast.success('Personal to-do added!');
  }

  async function handleUpdate(data) {
    await updateTask(editingTask.id, data);
    setEditingTask(null);
    toast.success('To-do updated!');
  }

  async function handleDelete() {
    await deleteTask(deletingTask.id);
    setDeletingTask(null);
    toast.success('To-do deleted');
  }

  async function handleToggle(taskId, currentStatus) {
    await toggleTaskStatus(taskId, currentStatus);
  }

  async function handleStatusChange(taskId, newStatus) {
    await changeTaskStatus(taskId, newStatus);
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
          <h1>Personal To-Dos</h1>
          <p className="header-subtitle">
            {isAdmin
              ? 'View your team\'s personal to-do lists'
              : 'Your personal task list'}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <FiPlus /> Add To-Do
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Employee filter for admin */}
        {isAdmin && employeesWithTodos.length > 0 && (
          <div className="filter-bar">
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '200px' }}
              value={viewingEmployee}
              onChange={(e) => setViewingEmployee(e.target.value)}
            >
              <option value="">All Personal To-Dos</option>
              {employeesWithTodos.map(emp => (
                <option key={emp.uid} value={emp.uid}>
                  {emp.name}'s To-Dos
                </option>
              ))}
            </select>
          </div>
        )}

        {personalTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No personal to-dos yet</h3>
            <p>Add personal tasks to keep track of your own work</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus /> Add Your First To-Do
            </button>
          </div>
        ) : (
          <>
            {todoTasks.length > 0 && (
              <div className="task-section">
                <div className="task-section-header">
                  <h2>📝 To Do <span className="task-count">{todoTasks.length}</span></h2>
                </div>
                {todoTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onToggle={handleToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
            {inProgressTasks.length > 0 && (
              <div className="task-section">
                <div className="task-section-header">
                  <h2>⚡ In Progress <span className="task-count">{inProgressTasks.length}</span></h2>
                </div>
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onToggle={handleToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
            {completedTasks.length > 0 && (
              <div className="task-section">
                <div className="task-section-header">
                  <h2>✅ Completed <span className="task-count">{completedTasks.length}</span></h2>
                </div>
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onToggle={handleToggle}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          isPersonalTodo={true}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingTask && (
        <ConfirmDialog
          title="Delete To-Do"
          message={`Delete "${deletingTask.title}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </>
  );
}

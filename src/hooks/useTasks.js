import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export function useTasks(filterOptions = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, isAdmin } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');

    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      let taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort newest first
      taskList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      // Filter by role / employee
      if (isAdmin) {
        if (filterOptions.employeeId) {
          const filterVal = filterOptions.employeeId.toLowerCase();
          taskList = taskList.filter(t => 
            t.assignedTo === filterOptions.employeeId ||
            t.assignedTo?.toLowerCase() === filterVal ||
            t.assignedToEmail?.toLowerCase() === filterVal
          );
        }
      } else {
        const myUid = userProfile.uid;
        const myEmail = userProfile.email?.toLowerCase();
        taskList = taskList.filter(t => 
          t.assignedTo === myUid || 
          t.assignedTo?.toLowerCase() === myEmail ||
          t.assignedToEmail?.toLowerCase() === myEmail ||
          t.createdBy === myUid
        );
      }

      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile, isAdmin, filterOptions.employeeId]);

  // Create a new task
  const createTask = useCallback(async (taskData) => {
    if (!userProfile) throw new Error('Not authenticated');

    const assignedToVal = taskData.assignedTo || userProfile.uid;
    const assignedToEmailVal = (
      taskData.assignedToEmail || 
      (assignedToVal.includes('@') ? assignedToVal : userProfile.email)
    )?.toLowerCase();

    const isPersonal = Boolean(taskData.isPersonalTodo || taskData.taskType === 'personal');

    const newTask = {
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      taskType: isPersonal ? 'personal' : 'assigned',
      isPersonalTodo: isPersonal,
      assignedTo: assignedToVal,
      assignedToEmail: assignedToEmailVal || '',
      assignedToName: taskData.assignedToName || userProfile.displayName,
      createdBy: userProfile.uid,
      createdByName: userProfile.displayName,
      createdByRole: userProfile.role || 'employee',
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    return docRef.id;
  }, [userProfile]);

  // Update a task
  const updateTask = useCallback(async (taskId, updates) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // Toggle task status (todo <-> completed)
  const toggleTaskStatus = useCallback(async (taskId, currentStatus) => {
    const taskRef = doc(db, 'tasks', taskId);
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    await updateDoc(taskRef, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? Timestamp.now() : null,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // Update task status
  const changeTaskStatus = useCallback(async (taskId, newStatus) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? Timestamp.now() : null,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (taskId) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  }, []);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    toggleTaskStatus,
    changeTaskStatus,
    deleteTask,
  };
}

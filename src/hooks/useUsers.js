import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, INITIAL_ADMIN_EMAILS, PRIMARY_ADMIN_EMAIL } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setUsers([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    let activeUsers = [];
    let registeredList = [];

    function combineAndSet() {
      const userMap = new Map();

      // 0. Ensure initial admins are always in the list with their roles
      INITIAL_ADMIN_EMAILS.forEach(adminEmail => {
        const emailLower = adminEmail.toLowerCase();
        userMap.set(emailLower, {
          uid: emailLower,
          email: emailLower,
          displayName: emailLower === 'janaganmeenambikai@gmail.com' ? 'Janagan' : 'Mithun',
          role: 'admin',
          status: 'active',
          isPending: false,
        });
      });

      // 1. Add/override active users who have logged in
      activeUsers.forEach(u => {
        if (u.email) {
          const emailLower = u.email.toLowerCase();
          const existing = userMap.get(emailLower) || {};
          userMap.set(emailLower, {
            ...existing,
            ...u,
            role: INITIAL_ADMIN_EMAILS.includes(emailLower) ? 'admin' : (u.role || existing.role || 'employee'),
            status: 'active',
            isPending: false,
          });
        }
      });

      // 2. Add or merge registered employees (invited by admin)
      registeredList.forEach(reg => {
        const emailLower = reg.email?.toLowerCase();
        if (emailLower) {
          if (userMap.has(emailLower)) {
            const existing = userMap.get(emailLower);
            userMap.set(emailLower, {
              ...existing,
              // Admin's registered name takes priority for employees over Google account profile name
              displayName: reg.displayName || existing.displayName,
              registeredAt: reg.registeredAt || existing.createdAt,
            });
          } else {
            userMap.set(emailLower, {
              uid: emailLower,
              email: emailLower,
              displayName: reg.displayName || emailLower.split('@')[0],
              role: reg.role || 'employee',
              status: 'invited',
              isPending: true,
              registeredAt: reg.registeredAt,
            });
          }
        }
      });

      const combined = Array.from(userMap.values());
      setUsers(combined);
      setEmployees(combined.filter(u => u.role === 'employee'));
      setLoading(false);
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        activeUsers = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        }));
        combineAndSet();
      },
      (err) => {
        console.warn('Error fetching users:', err);
        setLoading(false);
      }
    );

    const unsubReg = onSnapshot(
      collection(db, 'registered_employees'),
      (snapshot) => {
        registeredList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        combineAndSet();
      },
      (err) => {
        console.warn('Error fetching registered employees:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubReg();
    };
  }, [userProfile]);

  // Register an employee email (pre-authorize before they sign up)
  const addEmployee = useCallback(async (email, displayName) => {
    const emailClean = email.trim().toLowerCase();
    const nameClean = displayName?.trim() || emailClean.split('@')[0];
    const regRef = doc(db, 'registered_employees', emailClean);
    await setDoc(regRef, {
      email: emailClean,
      displayName: nameClean,
      role: 'employee',
      registeredAt: serverTimestamp(),
      registeredBy: userProfile.uid,
    });

    // Also update existing user document in users collection if this user has already signed in
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailClean));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
        for (const uDoc of userSnap.docs) {
          await setDoc(doc(db, 'users', uDoc.id), { displayName: nameClean }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Could not update existing user in users collection:', err);
    }

    return true;
  }, [userProfile]);

  // Update an employee's display name
  const updateEmployee = useCallback(async (email, newName) => {
    const emailClean = email.trim().toLowerCase();
    const nameClean = newName?.trim();
    if (!nameClean) return;

    // 1. Update registered_employees
    try {
      const regRef = doc(db, 'registered_employees', emailClean);
      await setDoc(regRef, { displayName: nameClean }, { merge: true });
    } catch (e) {
      console.warn('Error updating registered_employees:', e);
    }

    // 2. Update users collection
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailClean));
      const userSnap = await getDocs(q);
      if (!userSnap.empty) {
        for (const uDoc of userSnap.docs) {
          await setDoc(doc(db, 'users', uDoc.id), { displayName: nameClean }, { merge: true });
        }
      }
    } catch (e) {
      console.warn('Error updating users collection:', e);
    }
    return true;
  }, []);

  // Remove an employee
  const removeEmployee = useCallback(async (uid, email) => {
    const targetEmail = (email || uid)?.toLowerCase();
    if (INITIAL_ADMIN_EMAILS.includes(targetEmail)) {
      throw new Error('Cannot remove an admin through employee management');
    }

    // Delete from users collection if valid uid
    if (uid && !uid.includes('@')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        // May not exist in users
      }
    }

    // Delete from registered_employees collection
    if (targetEmail) {
      try {
        await deleteDoc(doc(db, 'registered_employees', targetEmail));
      } catch (e) {
        // Might not exist
      }
    }
  }, []);

  // Make someone an admin
  const makeAdmin = useCallback(async (uid) => {
    if (userProfile?.email !== PRIMARY_ADMIN_EMAIL) {
      throw new Error('Only the primary admin can manage admin roles');
    }
    await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  }, [userProfile]);

  // Remove admin role (make employee)
  const removeAdmin = useCallback(async (uid, email) => {
    if (userProfile?.email !== PRIMARY_ADMIN_EMAIL) {
      throw new Error('Only the primary admin can manage admin roles');
    }
    if (email === PRIMARY_ADMIN_EMAIL) {
      throw new Error('Cannot remove the primary admin');
    }
    await updateDoc(doc(db, 'users', uid), { role: 'employee' });
  }, [userProfile]);

  // Add a new admin by email
  const addAdmin = useCallback(async (email) => {
    if (userProfile?.email !== PRIMARY_ADMIN_EMAIL) {
      throw new Error('Only the primary admin can add admins');
    }
    
    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // User exists, update role
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      return true;
    }

    // Pre-register as admin in registered_employees
    const regRef = doc(db, 'registered_employees', email.toLowerCase());
    await setDoc(regRef, {
      email: email.toLowerCase(),
      displayName: email.split('@')[0],
      role: 'admin',
      registeredAt: serverTimestamp(),
      registeredBy: userProfile.uid,
    });
    return true;
  }, [userProfile]);

  return {
    users,
    employees,
    loading,
    addEmployee,
    updateEmployee,
    removeEmployee,
    makeAdmin,
    removeAdmin,
    addAdmin,
  };
}

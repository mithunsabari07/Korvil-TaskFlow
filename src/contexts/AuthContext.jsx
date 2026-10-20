import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider, INITIAL_ADMIN_EMAILS } from '../firebase/config';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to prevent infinite hangs when Firestore is not initialized
  function timeoutPromise(promise, ms = 3500) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Firestore may not be initialized.')), ms)
      ),
    ]);
  }

  // Check if user is registered in our system
  async function getUserProfile(uid, email = null) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const userEmail = (email || data.email)?.toLowerCase();

      // If user is employee, check if admin pre-registered a designated name in registered_employees
      if (userEmail && data.role !== 'admin') {
        try {
          const regDoc = await timeoutPromise(getDoc(doc(db, 'registered_employees', userEmail)), 2500);
          if (regDoc.exists() && regDoc.data().displayName && regDoc.data().displayName !== data.displayName) {
            const assignedName = regDoc.data().displayName;
            // Update Firestore users document in background so it stays synced
            setDoc(doc(db, 'users', uid), { displayName: assignedName }, { merge: true }).catch(() => {});
            return { uid, ...data, displayName: assignedName };
          }
        } catch {
          // Ignore
        }
      }
      return { uid, ...data };
    }
    return null;
  }

  // Create or update user profile in Firestore
  async function createUserProfile(user, role = null) {
    const userRef = doc(db, 'users', user.uid);
    let existingDoc = null;
    try {
      existingDoc = await timeoutPromise(getDoc(userRef), 3000);
    } catch {
      // Ignore if offline/unavailable
    }

    const emailLower = user.email?.toLowerCase();
    const isAdmin = INITIAL_ADMIN_EMAILS.includes(emailLower);
    
    // Check if this email was pre-registered by admin
    let registeredData = null;
    try {
      const regDoc = await timeoutPromise(getDoc(doc(db, 'registered_employees', emailLower)), 3000);
      if (regDoc.exists()) {
        registeredData = regDoc.data();
      }
    } catch (e) {
      console.warn('Could not check registered_employees:', e);
    }

    // If not admin and not explicitly given a role, check if they're registered as employee
    if (!isAdmin && !role && !registeredData) {
      return null;
    }

    const assignedRole = isAdmin ? 'admin' : (role || registeredData?.role || 'employee');
    const assignedName = registeredData?.displayName;

    // If document already exists, update display name if admin assigned one
    if (existingDoc && existingDoc.exists()) {
      const existingData = existingDoc.data();
      if (assignedName && assignedName !== existingData.displayName) {
        try {
          await timeoutPromise(setDoc(userRef, { displayName: assignedName }, { merge: true }), 3000);
          return { uid: user.uid, ...existingData, displayName: assignedName, role: assignedRole };
        } catch {
          return { uid: user.uid, ...existingData, displayName: assignedName, role: assignedRole };
        }
      }
      return { uid: user.uid, ...existingData };
    }

    const profile = {
      email: user.email,
      displayName: assignedName || user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      role: assignedRole,
      createdAt: serverTimestamp(),
      createdBy: isAdmin ? 'system' : 'admin',
    };

    try {
      await timeoutPromise(setDoc(userRef, profile), 3000);
    } catch (e) {
      console.warn('Could not save user profile to Firestore yet:', e);
      profile.isOfflineMode = true;
    }

    return { uid: user.uid, ...profile };
  }

  // Sign in with email/password
  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = INITIAL_ADMIN_EMAILS.includes(result.user.email?.toLowerCase());
    let profile = null;

    try {
      profile = await timeoutPromise(getUserProfile(result.user.uid, result.user.email), 3000);
    } catch {
      // Firestore offline
    }
    
    if (!profile) {
      try {
        profile = await timeoutPromise(createUserProfile(result.user), 3000);
      } catch {
        // Ignore
      }
    }

    if (!profile && isAdmin) {
      profile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Admin',
        photoURL: result.user.photoURL || null,
        role: 'admin',
        isOfflineMode: true,
      };
    }

    if (!profile) {
      await signOut(auth);
      throw new Error('Access denied. You are not registered in the system. Please contact your admin.');
    }
    
    setUserProfile(profile);
    return profile;
  }

  // Sign up with email/password
  async function signupWithEmail(email, password, displayName) {
    const isAdmin = INITIAL_ADMIN_EMAILS.includes(email.toLowerCase());
    
    if (!isAdmin) {
      let registered = { empty: true };
      try {
        const registeredQuery = query(
          collection(db, 'registered_employees'),
          where('email', '==', email.toLowerCase())
        );
        registered = await timeoutPromise(getDocs(registeredQuery), 3000);
      } catch (err) {
        console.warn('Could not verify registration:', err);
      }
      
      if (registered.empty) {
        throw new Error('Access denied. Your email is not registered. Please contact your admin to add you.');
      }
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    let profile = null;
    try {
      profile = await timeoutPromise(createUserProfile(result.user), 3000);
    } catch {
      // Ignore
    }

    if (!profile && isAdmin) {
      profile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || result.user.email?.split('@')[0] || 'Admin',
        photoURL: null,
        role: 'admin',
        isOfflineMode: true,
      };
    }

    setUserProfile(profile);
    return profile;
  }

  // Sign in with Google
  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const isAdmin = INITIAL_ADMIN_EMAILS.includes(result.user.email?.toLowerCase());
    let profile = null;

    try {
      profile = await timeoutPromise(getUserProfile(result.user.uid, result.user.email), 3000);
    } catch {
      // Ignore
    }
    
    if (!profile) {
      try {
        profile = await timeoutPromise(createUserProfile(result.user), 3000);
      } catch {
        // Ignore
      }
    }

    if (!profile && isAdmin) {
      profile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Admin',
        photoURL: result.user.photoURL || null,
        role: 'admin',
        isOfflineMode: true,
      };
    }

    if (!profile) {
      await signOut(auth);
      throw new Error('Access denied. You are not registered in the system. Please contact your admin.');
    }
    
    setUserProfile(profile);
    return profile;
  }

  // Logout
  async function logout() {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  }

  // Listen for auth state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__KORVIL_TEST_USER__) {
      const testUser = window.__KORVIL_TEST_USER__;
      setCurrentUser(testUser);
      setUserProfile(testUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdmin = INITIAL_ADMIN_EMAILS.includes(user.email?.toLowerCase());
        try {
          let profile = null;
          try {
            profile = await timeoutPromise(getUserProfile(user.uid, user.email), 3000);
          } catch (e) {
            console.warn('getUserProfile timeout or error:', e);
          }

          if (profile) {
            setUserProfile(profile);
          } else {
            // Try to create profile
            let newProfile = null;
            try {
              newProfile = await timeoutPromise(createUserProfile(user), 3000);
            } catch (e) {
              console.warn('createUserProfile timeout or error:', e);
            }

            if (newProfile) {
              setUserProfile(newProfile);
            } else if (isAdmin) {
              // Admin fallback if Firestore is not initialized yet
              setUserProfile({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
                photoURL: user.photoURL || null,
                role: 'admin',
                isOfflineMode: true,
              });
            } else {
              // Not authorized
              await signOut(auth);
              setUserProfile(null);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          if (isAdmin) {
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
              photoURL: user.photoURL || null,
              role: 'admin',
              isOfflineMode: true,
            });
          } else {
            setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    isAdmin: userProfile?.role === 'admin',
    isPrimaryAdmin: userProfile?.email === INITIAL_ADMIN_EMAILS[0],
    isOfflineMode: Boolean(userProfile?.isOfflineMode),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

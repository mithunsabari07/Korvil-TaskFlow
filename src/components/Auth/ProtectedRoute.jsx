import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userProfile, loading, logout } = useAuth();
  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowTimeoutNotice(true), 4000);
    } else {
      setShowTimeoutNotice(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Connecting to Korvil TaskFlow...</p>
        {showTimeoutNotice && (
          <div style={{ marginTop: '16px', textAlign: 'center', maxWidth: '360px', padding: '0 16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Taking longer than expected. Make sure Cloud Firestore is enabled in your Firebase Console.
            </p>
            <button
              onClick={() => logout()}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userProfile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

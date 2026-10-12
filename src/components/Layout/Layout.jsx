import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOfflineMode } = useAuth();

  return (
    <div className="app-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <FiMenu />
      </button>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        {isOfflineMode && (
          <div className="firestore-alert-banner">
            <FiAlertTriangle className="alert-icon" />
            <div className="alert-text">
              <strong>Action Required: Firestore Security Rules are blocking access.</strong>
              <span>
                Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Firebase Console</a> → <strong>Build</strong> → <strong>Firestore Database</strong> → <strong>Rules</strong> tab → paste the allowed rules and click <strong>"Publish"</strong>.
              </span>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

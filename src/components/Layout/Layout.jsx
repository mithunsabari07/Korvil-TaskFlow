import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { FiMenu, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOfflineMode } = useAuth();

  // Close sidebar on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Toggle Button */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        <FiMenu />
      </button>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content" id="main-content">
        {isOfflineMode && (
          <div className="firestore-alert-banner" role="alert">
            <FiAlertTriangle className="alert-icon" />
            <div className="alert-text">
              <strong>Action Required: Firestore Security Rules are blocking access.</strong>
              <span>
                Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a> → <strong>Build</strong> → <strong>Firestore Database</strong> → <strong>Rules</strong> tab → paste the allowed rules and click <strong>"Publish"</strong>.
              </span>
            </div>
          </div>
        )}
        <div className="main-outlet-wrapper">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

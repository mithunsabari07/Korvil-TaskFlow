import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { FiMenu, FiX, FiAlertTriangle } from 'react-icons/fi';
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
        id="sidebar-toggle-btn"
        className={`sidebar-toggle ${sidebarOpen ? 'is-active' : ''}`}
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Mobile Backdrop Overlay */}
      <div
        id="sidebar-backdrop"
        className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
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

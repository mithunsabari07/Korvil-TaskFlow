import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TaskList from './components/Tasks/TaskList';
import PersonalTodos from './components/Tasks/PersonalTodos';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import WorkSubmissions from './components/WorkSubmissions/WorkSubmissions';
import UserManagement from './components/Users/UserManagement';
import AdminSettings from './components/Users/AdminSettings';
import NotFound from './components/Common/NotFound';

// Use HashRouter when hosted on GitHub Pages (*.github.io) so routing and refreshes never 404
const Router = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
  ? HashRouter
  : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root Route — Redirect to dashboard (or login via ProtectedRoute) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/personal-todos" element={<PersonalTodos />} />
              <Route path="/work-submissions" element={<WorkSubmissions />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />

              {/* Admin-only Routes */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Not Found Route — ONLY for genuinely invalid / error routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

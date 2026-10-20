import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiCheckSquare, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import korvilLogo from '../../assets/logo';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('404 — Page Not Found', 'The requested page could not be found on Korvil TaskFlow.');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-brand">
          <img
            src={korvilLogo}
            alt="Korvil TaskFlow"
            className="not-found-logo"
            onError={(e) => {
              e.currentTarget.src = '/korvil-logo.png';
            }}
          />
        </div>
        <div className="not-found-badge">404 ERROR</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-text">
          The page or resource you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft /> Go Back
          </button>

          {currentUser ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">
                <FiHome /> Back to Dashboard
              </Link>
              <Link to="/tasks" className="btn btn-ghost">
                <FiCheckSquare /> View Tasks
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <FiHome /> Go to Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiShield, FiFileText, FiX, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer({ simple = false }) {
  const currentYear = new Date().getFullYear();
  const { currentUser } = useAuth();
  const [modalContent, setModalContent] = useState(null);

  return (
    <>
      <footer className={`app-footer ${simple ? 'simple-footer' : ''}`}>
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">Korvil TaskFlow</span>
            <span className="footer-copyright">
              © {currentYear} Korvil. All rights reserved.
            </span>
          </div>

          <div className="footer-links">
            {currentUser && !simple && (
              <>
                <Link to="/dashboard" className="footer-link">Dashboard</Link>
                <Link to="/tasks" className="footer-link">Tasks</Link>
                <Link to="/work-submissions" className="footer-link">Submissions</Link>
                <Link to="/analytics" className="footer-link">Analytics</Link>
              </>
            )}

            <button
              type="button"
              className="footer-link btn-link"
              onClick={() => setModalContent('privacy')}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="footer-link btn-link"
              onClick={() => setModalContent('terms')}
            >
              Terms of Service
            </button>
            
            <a href="mailto:support@korvil.com" className="footer-link contact-link" title="Email Korvil Support">
              <FiMail size={13} style={{ marginRight: 4 }} />
              support@korvil.com
            </a>
            
            <a href="tel:+18005550199" className="footer-link contact-link" title="Call Korvil Helpdesk">
              <FiPhone size={13} style={{ marginRight: 4 }} />
              +1 (800) 555-0199
            </a>
          </div>
        </div>
      </footer>

      {/* Legal & Compliance Modal */}
      {modalContent && (
        <div className="modal-overlay" onClick={() => setModalContent(null)}>
          <div
            className="modal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {modalContent === 'privacy' ? <FiShield color="var(--primary)" /> : <FiFileText color="var(--primary)" />}
                {modalContent === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setModalContent(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {modalContent === 'privacy' ? (
                <div className="legal-text">
                  <p><strong>Effective Year:</strong> {currentYear}</p>
                  <p>
                    Korvil TaskFlow is dedicated to safeguarding your workspace privacy and personal data.
                  </p>
                  <h4>1. Personal To-Do Privacy</h4>
                  <p>
                    Individual personal to-do tasks are stored securely. Personal completion rates are never broadcast
                    in public team-wide comparative tables.
                  </p>
                  <h4>2. File Storage Security</h4>
                  <p>
                    Work deliverables and PDFs uploaded by employees are stored in encrypted cloud storage with restricted
                    role-based access limited to the uploader, company founder, and authorized administrators.
                  </p>
                  <h4>3. Data Retention</h4>
                  <p>
                    Task records and audit logs are maintained for corporate workflow auditing and team operations.
                  </p>
                </div>
              ) : (
                <div className="legal-text">
                  <p><strong>Effective Year:</strong> {currentYear}</p>
                  <p>
                    By accessing Korvil TaskFlow, team members and administrators agree to the following terms:
                  </p>
                  <h4>1. Authorized Access</h4>
                  <p>
                    Access is restricted to pre-registered Korvil personnel. Account credentials must remain confidential.
                  </p>
                  <h4>2. Work Submissions</h4>
                  <p>
                    Deliverables submitted for review must represent genuine work. Revision history is maintained for accountability.
                  </p>
                  <h4>3. Administrative Oversight</h4>
                  <p>
                    Administrators reserve the right to review assigned tasks, manage team member invitations, and update task statuses.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalContent(null)}
              >
                <FiCheckCircle /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

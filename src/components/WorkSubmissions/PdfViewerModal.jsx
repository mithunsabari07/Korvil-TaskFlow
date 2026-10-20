import { useState, useRef, useEffect } from 'react';
import {
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiMaximize2,
  FiMinimize2,
  FiDownload,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiUser,
  FiFileText,
  FiLayers,
  FiRefreshCw,
  FiCornerDownRight,
} from 'react-icons/fi';
import { formatFileSize } from '../../hooks/useWorkSubmissions';
import { canReviewSubmissions } from '../../utils/permissions';

export default function PdfViewerModal({
  submission,
  currentUserProfile,
  onClose,
  onReview,
  onOpenTask,
}) {
  const isReviewer = canReviewSubmissions(currentUserProfile);
  const viewerContainerRef = useRef(null);

  // Viewer state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fitMode, setFitMode] = useState('width'); // 'width' | 'page'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Review action state
  const [reviewAction, setReviewAction] = useState(''); // 'under_review' | 'approved' | 'changes_requested'
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Handle Fullscreen toggle
  function toggleFullscreen() {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  function handleZoomIn() {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  }

  function handleZoomOut() {
    setZoomLevel(prev => Math.max(prev - 20, 50));
  }

  function handleResetZoom() {
    setZoomLevel(100);
  }

  function handleFitToggle() {
    setFitMode(prev => prev === 'width' ? 'page' : 'width');
  }

  // Format date helper
  function formatDateTime(val) {
    if (!val) return '—';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  // Submit review action
  async function handleReviewSubmit(e) {
    e.preventDefault();
    setFeedbackError('');

    if (reviewAction === 'changes_requested' && !reviewComment.trim()) {
      setFeedbackError('Please enter a feedback message explaining what changes are needed.');
      return;
    }

    setSubmittingReview(true);
    try {
      await onReview(submission.id, {
        action: reviewAction,
        reviewComment: reviewComment.trim(),
      });
      setReviewAction('');
      setReviewComment('');
    } catch (err) {
      setFeedbackError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  // Status Badge UI
  function renderStatusBadge(status) {
    switch (status) {
      case 'submitted':
        return <span className="submission-status-badge submitted"><FiClock size={12} /> Awaiting Review</span>;
      case 'under_review':
        return <span className="submission-status-badge under-review"><FiClock size={12} /> Under Review</span>;
      case 'approved':
        return <span className="submission-status-badge approved"><FiCheckCircle size={12} /> Approved</span>;
      case 'changes_requested':
        return <span className="submission-status-badge changes-requested"><FiAlertTriangle size={12} /> Changes Requested</span>;
      case 'draft':
        return <span className="submission-status-badge draft">Draft</span>;
      default:
        return <span className="submission-status-badge">{status}</span>;
    }
  }

  const pdfUrlWithParams = submission.fileUrl
    ? `${submission.fileUrl}#page=${currentPage}&zoom=${zoomLevel}`
    : null;

  return (
    <div className="modal-overlay pdf-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`pdf-modal-container ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={viewerContainerRef}>
        
        {/* Modal Top Header */}
        <div className="pdf-modal-header">
          <div className="pdf-modal-title-area">
            <div className="pdf-title-row">
              <span className="pdf-doc-icon"><FiFileText /></span>
              <h3 className="pdf-title">{submission.title}</h3>
              <span className="pdf-version-tag">v{submission.versionNumber || 1}</span>
            </div>
            <div className="pdf-meta-subtitle">
              <span>Submitted by <strong>{submission.employeeName}</strong></span>
              <span className="separator">•</span>
              <span>{formatDateTime(submission.submittedAt || submission.createdAt)}</span>
              {submission.taskTitle && (
                <>
                  <span className="separator">•</span>
                  <span className="related-task-link" onClick={() => onOpenTask && onOpenTask(submission.taskId)}>
                    Task: {submission.taskTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="pdf-header-actions">
            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                download={submission.fileName || 'submission.pdf'}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Download original PDF"
              >
                <FiDownload /> Download
              </a>
            )}
            {submission.fileUrl && (
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => window.open(submission.fileUrl, '_blank')}
                title="Open in new browser tab"
              >
                <FiExternalLink />
              </button>
            )}
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Full-screen document'}
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              title="Close viewer"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className="pdf-modal-body">
          
          {/* LEFT / MAIN PANEL: EMBEDDED PDF VIEWER */}
          <div className="pdf-viewer-panel">
            {/* Toolbar */}
            <div className="pdf-toolbar">
              <div className="toolbar-group">
                <button
                  className="toolbar-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  <FiChevronLeft />
                </button>
                <span className="page-indicator">
                  Page <input
                    type="number"
                    value={currentPage}
                    min="1"
                    max="999"
                    className="page-input"
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                  />
                </span>
                <button
                  className="toolbar-btn"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  title="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>

              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom out">
                  <FiZoomOut />
                </button>
                <button className="toolbar-btn zoom-text" onClick={handleResetZoom} title="Reset zoom">
                  {zoomLevel}%
                </button>
                <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom in">
                  <FiZoomIn />
                </button>
              </div>

              <div className="toolbar-group">
                <button
                  className={`toolbar-btn ${fitMode === 'width' ? 'active' : ''}`}
                  onClick={handleFitToggle}
                  title="Fit to width or page"
                >
                  Fit {fitMode === 'width' ? 'Width' : 'Page'}
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => {
                    setPreviewError(false);
                    setReloadKey(k => k + 1);
                  }}
                  title="Reload preview"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="pdf-viewport-area">
              {previewError || !submission.fileUrl ? (
                <div className="pdf-error-state">
                  <div className="error-icon">⚠️</div>
                  <h4>Unable to display inline PDF preview</h4>
                  <p>
                    Your browser could not preview this PDF directly. You can retry or download the document to view it.
                  </p>
                  <div className="error-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setPreviewError(false);
                        setReloadKey(k => k + 1);
                      }}
                    >
                      <FiRefreshCw /> Retry Preview
                    </button>
                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        download={submission.fileName || 'submission.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <FiDownload /> Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="pdf-embed-wrapper"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    width: fitMode === 'width' ? '100%' : '85%',
                    height: '100%',
                  }}
                >
                  <iframe
                    key={reloadKey}
                    src={pdfUrlWithParams}
                    title={submission.title}
                    className="pdf-iframe"
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE DETAILS PANEL */}
          <div className="pdf-details-panel">
            {/* Status & Basic Details */}
            <div className="details-section">
              <div className="details-header-row">
                <span className="details-label">CURRENT STATUS</span>
                {renderStatusBadge(submission.status)}
              </div>

              <div className="info-list">
                <div className="info-item">
                  <span className="info-title">Employee</span>
                  <div className="employee-info-box">
                    <div className="user-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                      {submission.employeeName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="info-val">{submission.employeeName}</div>
                      <a
                        href={`mailto:${submission.employeeEmail}`}
                        className="email-link info-subval"
                        title={`Email ${submission.employeeEmail}`}
                      >
                        {submission.employeeEmail}
                      </a>
                    </div>
                  </div>
                </div>

                {submission.taskTitle && (
                  <div className="info-item">
                    <span className="info-title">Related Task</span>
                    <div
                      className="info-val link-style"
                      onClick={() => onOpenTask && onOpenTask(submission.taskId)}
                      title="View task in task list"
                    >
                      <FiLayers style={{ marginRight: 4 }} />
                      {submission.taskTitle}
                    </div>
                  </div>
                )}

                <div className="info-item">
                  <span className="info-title">File Name & Size</span>
                  <div className="info-val">
                    {submission.fileName || 'document.pdf'}
                    <span className="file-size-tag">({formatFileSize(submission.fileSize)})</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-title">Submitted At</span>
                  <div className="info-val">
                    {formatDateTime(submission.submittedAt || submission.createdAt)}
                  </div>
                </div>

                {submission.description && (
                  <div className="info-item">
                    <span className="info-title">Work Description</span>
                    <div className="info-val description-text">
                      {submission.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Reviewer Feedback */}
            {submission.reviewedBy && (
              <div className="details-section review-feedback-box">
                <span className="details-label">REVIEWER FEEDBACK</span>
                <div className="feedback-reviewer">
                  <FiUser size={12} style={{ marginRight: 4 }} />
                  Reviewed by <strong>{submission.reviewedBy}</strong>
                  <span className="feedback-date">• {formatDateTime(submission.reviewedAt)}</span>
                </div>
                {submission.reviewComment ? (
                  <p className="feedback-comment">"{submission.reviewComment}"</p>
                ) : (
                  <p className="feedback-comment subtle">No written comment provided.</p>
                )}
              </div>
            )}

            {/* Founder/Admin Review Action Controls */}
            {isReviewer && (
              <div className="details-section review-controls-box">
                <span className="details-label">SUBMISSION REVIEW</span>
                <p className="review-instruction">
                  Review the document above and choose an action below:
                </p>

                <div className="review-action-buttons">
                  <button
                    type="button"
                    className={`btn btn-sm ${reviewAction === 'under_review' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setReviewAction('under_review');
                      setFeedbackError('');
                    }}
                  >
                    <FiClock /> Under Review
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${reviewAction === 'approved' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => {
                      setReviewAction('approved');
                      setFeedbackError('');
                    }}
                  >
                    <FiCheckCircle /> Approve
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${reviewAction === 'changes_requested' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => {
                      setReviewAction('changes_requested');
                      setFeedbackError('');
                    }}
                  >
                    <FiAlertTriangle /> Request Changes
                  </button>
                </div>

                {/* Feedback Input Form */}
                {reviewAction && (
                  <form onSubmit={handleReviewSubmit} className="review-action-form">
                    <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                      <label htmlFor="review-comment">
                        {reviewAction === 'changes_requested' ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            * Feedback message (required):
                          </span>
                        ) : (
                          <span>Review comment (optional):</span>
                        )}
                      </label>
                      <textarea
                        id="review-comment"
                        className="form-input"
                        rows={3}
                        placeholder={
                          reviewAction === 'changes_requested'
                            ? 'Explain what revisions or corrections are needed...'
                            : 'Add a congratulatory note or approval remark...'
                        }
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        autoFocus
                      />
                      {feedbackError && (
                        <div className="form-error-msg">{feedbackError}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setReviewAction('');
                          setReviewComment('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`btn btn-sm ${reviewAction === 'approved' ? 'btn-success' : reviewAction === 'changes_requested' ? 'btn-danger' : 'btn-primary'}`}
                        disabled={submittingReview}
                      >
                        {submittingReview ? (
                          <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                        ) : reviewAction === 'approved' ? (
                          'Confirm Approval'
                        ) : reviewAction === 'changes_requested' ? (
                          'Send Change Request'
                        ) : (
                          'Save Status'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Version History */}
            <div className="details-section">
              <span className="details-label">VERSION HISTORY</span>
              <div className="version-timeline">
                {submission.versionHistory && submission.versionHistory.length > 0 ? (
                  submission.versionHistory.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="version-badge">Version {item.version}</span>
                          <span className="timeline-time">{formatDateTime(item.submittedAt)}</span>
                        </div>
                        <div className="timeline-filename">{item.fileName}</div>
                        {item.note && <div className="timeline-note">{item.note}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="version-badge">Version 1</span>
                      <div className="timeline-filename">{submission.fileName}</div>
                      <div className="timeline-time">{formatDateTime(submission.submittedAt || submission.createdAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

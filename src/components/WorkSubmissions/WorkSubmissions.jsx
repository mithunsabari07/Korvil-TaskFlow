import { useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiTrash2,
  FiPlus,
  FiX,
  FiDownload,
  FiLayers,
  FiUser,
  FiCheckSquare,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useToast } from '../../contexts/ToastContext';
import { useWorkSubmissions, formatFileSize } from '../../hooks/useWorkSubmissions';
import { canReviewSubmissions } from '../../utils/permissions';
import PdfViewerModal from './PdfViewerModal';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function WorkSubmissions() {
  useDocumentTitle('Work Submissions', 'Submit deliverables, upload revision documents, and manage administrative reviews.');
  const { userProfile } = useAuth();
  const { tasks } = useTasks();
  const { users } = useUsers();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isReviewer = canReviewSubmissions(userProfile);
  const {
    submissions,
    loading,
    uploadProgress,
    createSubmission,
    submitRevision,
    reviewSubmission,
    deleteSubmission,
  } = useWorkSubmissions();

  // Navigation tab for employee: 'my_submissions' | 'submit_new'
  const [activeTab, setActiveTab] = useState('my_submissions');

  // Modal states
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [revisingSubmission, setRevisingSubmission] = useState(null);

  // Search & Filter state for Reviewer / Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Submit Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Revision Form state
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const revisionFileInputRef = useRef(null);

  // Employee's assigned tasks (non-personal) for dropdown selection
  const employeeAssignedTasks = useMemo(() => {
    const myUid = userProfile?.uid;
    const myEmail = userProfile?.email?.toLowerCase();
    return tasks.filter(t =>
      !t.isPersonalTodo &&
      (t.assignedTo === myUid ||
        t.assignedTo?.toLowerCase() === myEmail ||
        t.assignedToEmail?.toLowerCase() === myEmail)
    );
  }, [tasks, userProfile]);

  // Reviewer KPI Summary
  const summary = useMemo(() => {
    const total = submissions.length;
    const awaiting = submissions.filter(s => s.status === 'submitted').length;
    const underReview = submissions.filter(s => s.status === 'under_review').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const changesRequested = submissions.filter(s => s.status === 'changes_requested').length;
    return { total, awaiting, underReview, approved, changesRequested };
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.employeeName?.toLowerCase().includes(q) ||
        s.fileName?.toLowerCase().includes(q) ||
        s.taskTitle?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter);
    }

    // Employee filter (Admin)
    if (employeeFilter !== 'all') {
      const empLower = employeeFilter.toLowerCase();
      list = list.filter(s =>
        s.employeeUid === employeeFilter ||
        s.employeeEmail?.toLowerCase() === empLower
      );
    }

    // Task filter
    if (taskFilter !== 'all') {
      list = list.filter(s => s.taskId === taskFilter);
    }

    // Sorting
    list.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [submissions, searchQuery, statusFilter, employeeFilter, taskFilter, sortOrder]);

  // Handle file drop & selection
  function handleFileDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }

  function handleFileInputChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }

  function validateAndSetFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are accepted');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File exceeds maximum size limit of 25MB');
      return;
    }
    setSelectedFile(file);
    toast.success(`Selected "${file.name}"`);
  }

  // Handle Work Submission Form submit
  async function handleSubmitWork(isDraft = false) {
    if (!formTitle.trim()) {
      toast.error('Please enter a submission title');
      return;
    }
    if (!selectedFile && !isDraft) {
      toast.error('Please upload a PDF document before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const selectedTask = employeeAssignedTasks.find(t => t.id === formTaskId);
      await createSubmission({
        title: formTitle,
        description: formDescription,
        taskId: formTaskId || null,
        taskTitle: selectedTask?.title || '',
        pdfFile: selectedFile,
        isDraft,
      });

      toast.success(isDraft ? 'Draft saved successfully' : 'Work submitted for review!');
      setFormTitle('');
      setFormDescription('');
      setFormTaskId('');
      setSelectedFile(null);
      setActiveTab('my_submissions');
    } catch (err) {
      toast.error(err.message || 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Revision Submit
  async function handleRevisionSubmit(e) {
    e.preventDefault();
    if (!revisionFile) {
      toast.error('Please select a revised PDF document');
      return;
    }

    setSubmittingRevision(true);
    try {
      await submitRevision(revisingSubmission.id, {
        pdfFile: revisionFile,
        revisionNote: revisionNote.trim(),
      });
      toast.success('Revised document submitted for review!');
      setRevisingSubmission(null);
      setRevisionFile(null);
      setRevisionNote('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit revision');
    } finally {
      setSubmittingRevision(false);
    }
  }

  // Helper date formatter
  function formatDateTime(val) {
    if (!val) return '—';
    try {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  }

  // Render status badge
  function renderStatusBadge(status, isNew = false) {
    switch (status) {
      case 'submitted':
        return (
          <span className={`submission-status-badge submitted ${isNew ? 'pulse-badge' : ''}`}>
            <FiClock size={11} /> {isNew ? 'New • Awaiting Review' : 'Awaiting Review'}
          </span>
        );
      case 'under_review':
        return <span className="submission-status-badge under-review"><FiRefreshCw size={11} /> Under Review</span>;
      case 'approved':
        return <span className="submission-status-badge approved"><FiCheckCircle size={11} /> Approved</span>;
      case 'changes_requested':
        return <span className="submission-status-badge changes-requested"><FiAlertTriangle size={11} /> Changes Requested</span>;
      case 'draft':
        return <span className="submission-status-badge draft">Draft</span>;
      default:
        return <span className="submission-status-badge">{status}</span>;
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Work Submissions</h1>
          <p className="header-subtitle">
            {isReviewer
              ? 'Review, verify, and approve PDF work deliverables from team members.'
              : 'Submit completed work, deliverables, and reports for administrator review.'}
          </p>
        </div>

        {/* Employee Header Action: Switch to Submit Work */}
        {!isReviewer && activeTab === 'my_submissions' && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setActiveTab('submit_new')}>
              <FiPlus /> Submit New Work
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* =========================================================================
            FOUNDER & ADMIN REVIEW DASHBOARD VIEW
           ========================================================================= */}
        {isReviewer ? (
          <div>
            {/* Top Summary KPI Cards */}
            <div className="stats-grid kpi-grid-5">
              <div
                className="stat-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('all')}
                title="View all submissions"
              >
                <div className="stat-header">
                  <div className="stat-icon primary"><FiFileText /></div>
                  <span className="stat-label">Total Submissions</span>
                </div>
                <div className="stat-value">{summary.total}</div>
                <div className="stat-change">All submitted documents</div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('submitted')}
                title="Filter awaiting review"
              >
                <div className="stat-header">
                  <div className="stat-icon primary" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284C7' }}>
                    <FiClock />
                  </div>
                  <span className="stat-label">Awaiting Review</span>
                </div>
                <div className="stat-value" style={{ color: '#0284C7' }}>{summary.awaiting}</div>
                <div className="stat-change">Needs founder/admin review</div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('under_review')}
                title="Filter under review"
              >
                <div className="stat-header">
                  <div className="stat-icon warning"><FiRefreshCw /></div>
                  <span className="stat-label">Under Review</span>
                </div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{summary.underReview}</div>
                <div className="stat-change">Actively being inspected</div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('approved')}
                title="Filter approved"
              >
                <div className="stat-header">
                  <div className="stat-icon success"><FiCheckCircle /></div>
                  <span className="stat-label">Approved</span>
                </div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{summary.approved}</div>
                <div className="stat-change">Verified deliverables</div>
              </div>

              <div
                className="stat-card"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('changes_requested')}
                title="Filter changes requested"
              >
                <div className="stat-header">
                  <div className="stat-icon danger"><FiAlertTriangle /></div>
                  <span className="stat-label">Changes Requested</span>
                </div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{summary.changesRequested}</div>
                <div className="stat-change">Revision feedback sent</div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="filter-bar submissions-filter-bar">
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by employee, title, document name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Awaiting Review</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="changes_requested">Changes Requested</option>
              </select>

              {/* Employee Filter */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '170px' }}
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="all">All Employees</option>
                {users.map(u => (
                  <option key={u.uid || u.email} value={u.uid || u.email}>
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>

              {/* Sort Order */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '130px' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Submissions Table */}
            <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Submission Title</th>
                      <th>Related Task</th>
                      <th>Submitted Date</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map(sub => {
                      const isUnreviewed = sub.status === 'submitted';
                      return (
                        <tr key={sub.id} className={isUnreviewed ? 'highlight-new-row' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                {sub.employeeName?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{sub.employeeName}</div>
                                <a
                                  href={`mailto:${sub.employeeEmail}`}
                                  className="email-link"
                                  style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}
                                  title={`Email ${sub.employeeEmail}`}
                                >
                                  {sub.employeeEmail}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <div className="truncate-text" style={{ maxWidth: 220 }} title={sub.title}>
                              {sub.title}
                            </div>
                          </td>
                          <td>
                            {sub.taskTitle ? (
                              <span
                                className="task-link-badge"
                                onClick={() => navigate('/tasks')}
                                title="View in tasks"
                              >
                                <FiLayers size={10} style={{ marginRight: 3 }} />
                                {sub.taskTitle}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>General Work</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatDateTime(sub.submittedAt || sub.createdAt)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiFileText color="#DC2626" />
                              <span style={{ fontSize: '12px', fontWeight: 500 }} title={sub.fileName}>
                                {sub.fileName || 'document.pdf'}
                              </span>
                              <span className="version-pill">v{sub.versionNumber || 1}</span>
                            </div>
                          </td>
                          <td>
                            {renderStatusBadge(sub.status, isUnreviewed)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setViewingSubmission(sub)}
                              title="Open document in built-in PDF viewer"
                            >
                              <FiEye /> Review Document
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredSubmissions.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                          <div className="empty-state">
                            <div className="empty-icon">📂</div>
                            <h3>No work submissions found</h3>
                            <p>
                              {searchQuery || statusFilter !== 'all' || employeeFilter !== 'all'
                                ? 'Try adjusting your search filters'
                                : 'No employee work submissions have been uploaded yet.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              EMPLOYEE EXPERIENCE VIEW: TABS (My Submissions vs Submit Work)
             ========================================================================= */
          <div>
            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'my_submissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('my_submissions')}
              >
                <FiCheckSquare style={{ marginRight: 6 }} /> My Submissions ({submissions.length})
              </button>
              <button
                className={`tab ${activeTab === 'submit_new' ? 'active' : ''}`}
                onClick={() => setActiveTab('submit_new')}
              >
                <FiUploadCloud style={{ marginRight: 6 }} /> Submit Work
              </button>
            </div>

            {/* TAB 1: MY SUBMISSIONS */}
            {activeTab === 'my_submissions' && (
              <div>
                {submissions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📤</div>
                    <h3>No work submissions yet</h3>
                    <p>Submit your task deliverables, reports, and documentation as PDF files.</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('submit_new')}>
                      <FiPlus /> Submit Your First Work
                    </button>
                  </div>
                ) : (
                  <div className="submissions-cards-grid">
                    {submissions.map(sub => {
                      const needsChanges = sub.status === 'changes_requested';
                      return (
                        <div key={sub.id} className={`submission-card ${needsChanges ? 'card-changes-requested' : ''}`}>
                          <div className="submission-card-header">
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h3 className="submission-card-title">{sub.title}</h3>
                                <span className="version-pill">v{sub.versionNumber || 1}</span>
                              </div>
                              {sub.taskTitle && (
                                <span className="task-link-badge">
                                  <FiLayers size={10} style={{ marginRight: 3 }} /> Task: {sub.taskTitle}
                                </span>
                              )}
                            </div>
                            {renderStatusBadge(sub.status)}
                          </div>

                          {sub.description && (
                            <p className="submission-card-desc">{sub.description}</p>
                          )}

                          <div className="submission-card-fileinfo">
                            <FiFileText color="#DC2626" size={16} />
                            <span className="file-name">{sub.fileName || 'document.pdf'}</span>
                            <span className="file-size">({formatFileSize(sub.fileSize)})</span>
                            <span className="submitted-time">• {formatDateTime(sub.submittedAt || sub.createdAt)}</span>
                          </div>

                          {/* Admin Feedback alert if changes requested */}
                          {needsChanges && sub.reviewComment && (
                            <div className="admin-feedback-alert">
                              <div className="alert-header">
                                <FiAlertTriangle size={14} /> Feedback from Reviewer:
                              </div>
                              <p className="alert-body">"{sub.reviewComment}"</p>
                            </div>
                          )}

                          {/* Card Actions */}
                          <div className="submission-card-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setViewingSubmission(sub)}
                            >
                              <FiEye /> View PDF
                            </button>

                            {needsChanges && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setRevisingSubmission(sub)}
                              >
                                <FiUploadCloud /> Upload Revision
                              </button>
                            )}

                            {sub.status === 'draft' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                                onClick={() => deleteSubmission(sub.id)}
                              >
                                <FiTrash2 /> Delete Draft
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SUBMIT WORK FORM */}
            {activeTab === 'submit_new' && (
              <div className="chart-card submit-work-card">
                <div className="chart-header">
                  <h3>Submit Completed Work</h3>
                  <span className="chart-tag">PDF DELIVERABLE</span>
                </div>
                <p className="chart-subtitle">
                  Upload your deliverables, documentation, or reports in PDF format for founder & administrator review.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmitWork(false); }}>
                  <div className="form-group">
                    <label htmlFor="submission-title">Submission Title *</label>
                    <input
                      id="submission-title"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Q3 Project Alpha Architecture Report"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="related-task">Related Task (Optional)</label>
                    <select
                      id="related-task"
                      className="form-select"
                      value={formTaskId}
                      onChange={(e) => setFormTaskId(e.target.value)}
                    >
                      <option value="">Select an assigned task (optional)</option>
                      {employeeAssignedTasks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="work-desc">Work Description</label>
                    <textarea
                      id="work-desc"
                      className="form-input"
                      rows={3}
                      placeholder="Briefly describe the work completed, findings, or notes for the reviewer..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>

                  {/* Drag-and-Drop PDF Upload Zone */}
                  <div className="form-group">
                    <label>PDF Document *</label>
                    <div
                      className={`pdf-dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf,.pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                      />

                      {!selectedFile ? (
                        <div className="dropzone-content">
                          <div className="dropzone-icon"><FiUploadCloud /></div>
                          <h4>Drag and drop your PDF here</h4>
                          <p className="dropzone-sub">or browse files from your device</p>
                          <span className="dropzone-badge">Format: PDF only (max 25MB)</span>
                        </div>
                      ) : (
                        <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
                          <div className="file-info-icon"><FiFileText size={28} color="#DC2626" /></div>
                          <div className="file-info-details">
                            <div className="file-info-name">{selectedFile.name}</div>
                            <div className="file-info-size">{formatFileSize(selectedFile.size)}</div>
                            {uploadProgress > 0 && (
                              <div className="progress-bar-bg" style={{ marginTop: '6px', height: '6px' }}>
                                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            Replace File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('my_submissions')}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleSubmitWork(true)}
                      disabled={submitting || !formTitle.trim()}
                    >
                      Save as Draft
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || !formTitle.trim() || !selectedFile}
                    >
                      {submitting ? (
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                      ) : (
                        <>
                          <FiUploadCloud /> Submit Work
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          BUILT-IN PDF VIEWER MODAL
         ========================================================================= */}
      {viewingSubmission && (
        <PdfViewerModal
          submission={viewingSubmission}
          currentUserProfile={userProfile}
          onClose={() => setViewingSubmission(null)}
          onReview={async (subId, reviewData) => {
            await reviewSubmission(subId, reviewData);
            toast.success(`Submission marked as ${reviewData.action.replace('_', ' ')}`);
            // Update local modal data
            setViewingSubmission(prev => prev ? { ...prev, status: reviewData.action, reviewComment: reviewData.reviewComment } : null);
          }}
          onOpenTask={(taskId) => {
            setViewingSubmission(null);
            navigate('/tasks');
          }}
        />
      )}

      {/* =========================================================================
          UPLOAD REVISION MODAL (For Employees when Changes Requested)
         ========================================================================= */}
      {revisingSubmission && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setRevisingSubmission(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Upload Revised PDF — v{(revisingSubmission.versionNumber || 1) + 1}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setRevisingSubmission(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit}>
              <div className="modal-body">
                {revisingSubmission.reviewComment && (
                  <div className="admin-feedback-alert" style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="alert-header">
                      <FiAlertTriangle size={14} /> Requested Changes:
                    </div>
                    <p className="alert-body">"{revisingSubmission.reviewComment}"</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Select Revised PDF *</label>
                  <div
                    className="pdf-dropzone"
                    style={{ padding: 'var(--space-5)' }}
                    onClick={() => revisionFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={revisionFileInputRef}
                      accept="application/pdf,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                            toast.error('Only PDF documents are accepted');
                            return;
                          }
                          setRevisionFile(file);
                        }
                      }}
                    />
                    {!revisionFile ? (
                      <div className="dropzone-content">
                        <FiUploadCloud size={28} color="var(--primary)" />
                        <h4 style={{ margin: '6px 0 2px' }}>Click to choose revised PDF</h4>
                        <span className="dropzone-badge">PDF only (max 25MB)</span>
                      </div>
                    ) : (
                      <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
                        <FiFileText size={24} color="#DC2626" />
                        <div className="file-info-details">
                          <div className="file-info-name">{revisionFile.name}</div>
                          <div className="file-info-size">{formatFileSize(revisionFile.size)}</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => revisionFileInputRef.current?.click()}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="revision-note">Revision Note (Optional)</label>
                  <textarea
                    id="revision-note"
                    className="form-input"
                    rows={3}
                    placeholder="Describe what changes were made in this revision..."
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRevisingSubmission(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRevision || !revisionFile}
                >
                  {submittingRevision ? (
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                  ) : (
                    'Submit Revision'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

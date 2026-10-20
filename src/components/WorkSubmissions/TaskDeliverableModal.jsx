import { useState, useRef } from 'react';
import {
  FiX,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiLayers,
} from 'react-icons/fi';
import { formatFileSize, useWorkSubmissions } from '../../hooks/useWorkSubmissions';
import { useToast } from '../../contexts/ToastContext';
import { getPriorityInfo } from '../../utils/permissions';

export default function TaskDeliverableModal({
  task,
  isOpen,
  onClose,
  onSuccess,
}) {
  const toast = useToast();
  const { createSubmission, uploadProgress } = useWorkSubmissions();

  const [title, setTitle] = useState(task ? `Deliverable: ${task.title}` : '');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !task) return null;

  const priority = getPriorityInfo(task.priority);

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
      toast.error('File size cannot exceed 25MB');
      return;
    }
    setSelectedFile(file);
    toast.success(`Selected "${file.name}"`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a submission title');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select or drop a PDF file to submit');
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission({
        title: title.trim(),
        description: description.trim(),
        taskId: task.id,
        taskTitle: task.title,
        pdfFile: selectedFile,
        isDraft: false,
      });

      toast.success('Work deliverable submitted for review!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit work deliverable');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)', fontSize: '1.2rem', display: 'flex' }}>
              <FiUploadCloud />
            </span>
            <h3>Submit Work Deliverable</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Task Info Pill */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <FiLayers style={{ marginRight: 4 }} /> Related Task
                </span>
                <span
                  className="task-badge priority-badge"
                  style={{ backgroundColor: priority.bg, color: priority.color, borderColor: priority.border }}
                >
                  {priority.label}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                {task.title}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="deliverable-title">Submission Title *</label>
              <input
                id="deliverable-title"
                type="text"
                className="form-input"
                placeholder="e.g., Deliverable: Project Prototype Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliverable-desc">Work Description / Notes (Optional)</label>
              <textarea
                id="deliverable-desc"
                className="form-input"
                rows={2}
                placeholder="Briefly describe what is attached or corrections made..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Drag & Drop PDF */}
            <div className="form-group">
              <label>Attach PDF File *</label>
              <div
                className={`pdf-dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                style={{ padding: selectedFile ? 'var(--space-4)' : 'var(--space-6)' }}
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
                    <div className="dropzone-icon" style={{ fontSize: '1.8rem', marginBottom: 4 }}>
                      <FiUploadCloud />
                    </div>
                    <h4 style={{ fontSize: 'var(--font-sm)', margin: '0 0 2px' }}>Drag & drop your PDF file here</h4>
                    <p className="dropzone-sub" style={{ margin: '0 0 6px' }}>or click to browse from device</p>
                    <span className="dropzone-badge" style={{ fontSize: '10px' }}>PDF documents only (max 25MB)</span>
                  </div>
                ) : (
                  <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
                    <FiFileText size={28} color="#DC2626" />
                    <div className="file-info-details">
                      <div className="file-info-name">{selectedFile.name}</div>
                      <div className="file-info-size">{formatFileSize(selectedFile.size)}</div>
                      {uploadProgress > 0 && (
                        <div className="progress-bar-bg" style={{ marginTop: '6px', height: '5px' }}>
                          <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel / Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !title.trim() || !selectedFile}
            >
              {submitting ? (
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
              ) : (
                <>
                  <FiUploadCloud /> Submit Deliverable
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

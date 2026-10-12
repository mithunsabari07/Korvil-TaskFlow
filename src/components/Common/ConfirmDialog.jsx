import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="confirm-body">
            <div className="confirm-icon" style={{ color: variant === 'danger' ? 'var(--danger)' : 'var(--warning)' }}>
              <FiAlertTriangle size={48} />
            </div>
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

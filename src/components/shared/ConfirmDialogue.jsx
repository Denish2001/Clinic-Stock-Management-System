import { Button } from './Button';

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog__actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

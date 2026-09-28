import { useCallback, useRef, useState } from 'react';
import { CloseIcon } from './TeacherIcons';

export default function useConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    setDialog({
      message,
      title: options.title || 'Please confirm',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      tone: options.tone || 'default',
    });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  const confirmDialog = dialog ? (
    <div className="teacher-modal-backdrop" onClick={() => settle(false)}>
      <div className="teacher-modal" role="alertdialog" aria-modal="true" aria-labelledby="teacher-confirm-title" onClick={(event) => event.stopPropagation()}>
        <div className="teacher-modal-head">
          <h3 id="teacher-confirm-title">{dialog.title}</h3>
          <button type="button" className="teacher-icon-button" onClick={() => settle(false)} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className="teacher-confirm-message">{dialog.message}</p>

        <div className="teacher-confirm-actions">
          <button type="button" className="teacher-secondary-button" onClick={() => settle(false)}>
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            className={dialog.tone === 'danger' ? 'teacher-primary-button danger' : 'teacher-primary-button'}
            onClick={() => settle(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return [confirmDialog, confirm];
}

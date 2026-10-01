import { useCallback, useRef, useState } from 'react';
import TeacherModal from './TeacherModal';

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

  const settle = useCallback((result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const cancel = useCallback(() => settle(false), [settle]);

  const confirmDialog = dialog ? (
    <TeacherModal
      title={dialog.title}
      onClose={cancel}
      size="sm"
      role="alertdialog"
      footer={(
        <>
          <button type="button" className="tw-btn tw-btn-ghost" onClick={cancel}>
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            className={dialog.tone === 'danger' ? 'tw-btn tw-btn-danger' : 'tw-btn tw-btn-primary'}
            onClick={() => settle(true)}
          >
            {dialog.confirmLabel}
          </button>
        </>
      )}
    >
      <p className="tw-confirm-text">{dialog.message}</p>
    </TeacherModal>
  ) : null;

  return [confirmDialog, confirm];
}

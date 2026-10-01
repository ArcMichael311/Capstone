import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './TeacherIcons';
import './TeacherWorkspace.css';

// Shared teacher modal: rendered on document.body, closes on Escape or backdrop click.
export default function TeacherModal({ title, subtitle, onClose, size = 'md', role = 'dialog', footer = null, children }) {
  const titleId = useId();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="tw-theme tw-modal-backdrop" onMouseDown={onClose}>
      <div
        className={`tw-modal tw-modal-${size}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="tw-modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="tw-icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="tw-modal-body">{children}</div>
        {footer && <footer className="tw-modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

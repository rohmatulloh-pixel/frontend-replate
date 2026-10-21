import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  onConfirm,
  confirmVariant = 'primary',
  showActions = true
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 shadow-card relative space-y-4 animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-dialog-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with >=36-40px touch area */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors focus:ring-2 focus:ring-brand-500 focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        {title && (
          <h3 id="modal-dialog-title" className="text-xl sm:text-2xl font-display font-extrabold text-brand-900 pb-3 border-b border-slate-100 pr-8">
            {title}
          </h3>
        )}

        {/* Content */}
        <div className="text-xs sm:text-sm font-sans font-semibold text-slate-600 leading-relaxed">
          {children}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            {onConfirm && (
              <Button variant={confirmVariant} size="sm" onClick={onConfirm} className="text-xs">
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

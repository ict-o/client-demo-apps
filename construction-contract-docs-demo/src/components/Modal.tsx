import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  /** 印刷対象にしたい場合など、本文領域に付与するクラス */
  bodyClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, width = 520, bodyClassName }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(20, 30, 40, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 0.2s ease',
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.97) translateY(-8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div
          className="no-print"
          style={{
            padding: '18px 24px 15px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              fontSize: '22px',
              color: 'var(--text-sub)',
              lineHeight: 1,
              width: '44px',
              height: '44px',
              flex: 'none',
              borderRadius: 'var(--radius-md)',
            }}
          >
            &times;
          </button>
        </div>
        <div className={bodyClassName} style={{ padding: '22px 24px', overflowY: 'auto' }}>{children}</div>
        {footer && (
          <div
            className="no-print"
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

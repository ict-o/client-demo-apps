import { useEffect } from 'react';

export interface ToastState {
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

export function ToastContainer({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4600);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bg =
    toast.type === 'error' ? 'var(--error)' :
    toast.type === 'info' ? 'var(--info)' :
    'var(--success)';

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print"
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        padding: '16px 26px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '16px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        width: 'max-content',
        maxWidth: '90vw',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        animation: 'toastIn 0.22s ease',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <span
        aria-hidden="true"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {toast.type === 'error' ? '!' : '✓'}
      </span>
      {toast.message}
    </div>
  );
}

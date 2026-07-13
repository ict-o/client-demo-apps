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
    const timer = setTimeout(onClose, 3200);
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
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        padding: '12px 22px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        maxWidth: '90vw',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'toastIn 0.22s ease',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <span aria-hidden="true">✓</span>
      {toast.message}
    </div>
  );
}

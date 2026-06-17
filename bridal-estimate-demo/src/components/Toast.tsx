import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bg = type === 'success' ? 'var(--success)' : 'var(--accent)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        maxWidth: '320px',
        animation: 'toastIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {message}
    </div>
  );
}

interface ToastState {
  message: string;
  type?: 'success' | 'info';
}

interface ToastContainerProps {
  toast: ToastState | null;
  onClose: () => void;
}

export function ToastContainer({ toast, onClose }: ToastContainerProps) {
  if (!toast) return null;
  return <Toast message={toast.message} type={toast.type} onClose={onClose} />;
}

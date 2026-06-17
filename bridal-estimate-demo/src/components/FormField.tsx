import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, error, children, hint }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-sub)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--error)', fontSize: '11px' }}>*</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--error)' }}>{error}</span>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  color: 'var(--text)',
  background: 'var(--card)',
  outline: 'none',
  transition: 'border-color 0.15s',
  lineHeight: 1.5,
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        ...inputBase,
        borderColor: hasError ? 'var(--error)' : 'var(--border)',
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = hasError ? 'var(--error)' : 'var(--border)';
      }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const { hasError, style, ...rest } = props;
  return (
    <select
      {...rest}
      style={{
        ...inputBase,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237A736B' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '32px',
        cursor: 'pointer',
        borderColor: hasError ? 'var(--error)' : 'var(--border)',
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = hasError ? 'var(--error)' : 'var(--border)';
      }}
    />
  );
}

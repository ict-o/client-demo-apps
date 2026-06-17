import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: '1px solid var(--accent)',
  },
  secondary: {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-sub)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--card)',
    color: 'var(--error)',
    border: '1px solid var(--error)',
  },
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '9px 20px', fontSize: '13px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '12px 28px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
};

export function Button({ variant = 'primary', size = 'md', children, style, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s, opacity 0.15s, box-shadow 0.15s',
        boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...styles[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

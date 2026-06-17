import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '0 40px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1.5px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '0.08em',
            }}
          >
            Bridal Estimate
          </span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <NavItem
            label="見積一覧"
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          />
        </nav>
      </header>

      <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--accent-light)' : 'none',
        border: 'none',
        padding: '6px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent-dark)' : 'var(--text-sub)',
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

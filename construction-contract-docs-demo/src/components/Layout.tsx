import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CURRENT_USER, OWN_COMPANY } from '../data/sampleData';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { label: '工事案件一覧', path: '/' },
  { label: '新規見積作成', path: '/new' },
  { label: '取引先マスタ', path: '/partners' },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/project');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      <header
        className="no-print"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="app-header-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 32px',
            height: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <button
            onClick={() => navigate('/')}
            aria-label="工事案件一覧へ"
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '11px', padding: 0 }}
          >
            <BrandMark />
            <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <span style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>
                工事契約書類管理システム
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-sub)' }}>
                {OWN_COMPANY.name} {OWN_COMPANY.division}
              </span>
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.3 }} className="viewer-name">
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{CURRENT_USER.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{CURRENT_USER.department}</div>
            </div>
            <span
              aria-hidden="true"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--accent-dark)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flex: 'none',
              }}
            >
              {CURRENT_USER.name.charAt(0)}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }}>
          <nav
            className="app-header-inner"
            aria-label="メインメニュー"
            style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: '4px', overflowX: 'auto' }}
          >
            {NAV.map(n => (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '13px 6px',
                  marginRight: '18px',
                  fontSize: '13.5px',
                  fontWeight: isActive(n.path) ? 700 : 500,
                  color: isActive(n.path) ? 'var(--accent-dark)' : 'var(--text-sub)',
                  borderBottom: isActive(n.path) ? '2px solid var(--accent)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer
        className="no-print"
        style={{
          borderTop: '1px solid var(--border)',
          padding: '18px 32px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
        }}
      >
        本画面は提案用のデモンストレーションです。表示されている会社名・担当者名・工事内容・金額はすべて架空のサンプルです。
      </footer>
    </div>
  );
}

function BrandMark() {
  return (
    <span
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        background: 'var(--accent)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-hidden="true"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    </span>
  );
}

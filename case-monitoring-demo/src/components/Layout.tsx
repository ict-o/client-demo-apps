import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OPERATING_COMPANY, VIEWER } from '../data/sampleData';

interface LayoutProps {
  /** 未対応アラート件数（ナビのバッジ表示用） */
  openAlerts: number;
  children: React.ReactNode;
}

export function Layout({ openAlerts, children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isDashboard = path === '/';
  const isCases = path === '/cases' || path.startsWith('/cases/');
  const isAlerts = path === '/alerts';

  return (
    <div className="app-shell">
      <header
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
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '0 32px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <button
            onClick={() => navigate('/')}
            aria-label="ダッシュボードへ"
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '11px', padding: 0 }}
          >
            <BrandMark />
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>
                案件進捗モニタリングシステム
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{OPERATING_COMPANY}</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="live-badge" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span className="live-dot" aria-hidden="true" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>リアルタイム監視中</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.3 }} className="viewer-name">
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{VIEWER.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{VIEWER.role}</div>
              </div>
              <Avatar name={VIEWER.name} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }}>
          <nav
            style={{
              maxWidth: '1180px',
              margin: '0 auto',
              padding: '0 32px',
              display: 'flex',
              gap: '4px',
            }}
          >
            <NavItem label="ダッシュボード" active={isDashboard} onClick={() => navigate('/')} />
            <NavItem label="案件一覧" active={isCases} onClick={() => navigate('/cases')} />
            <NavItem label="アラート" active={isAlerts} onClick={() => navigate('/alerts')} badge={openAlerts} />
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '18px 32px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
        }}
      >
        本画面はデモンストレーション用です。表示されている企業名・担当者名・案件・金額はすべて架空のサンプルです。
      </footer>
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '13px 6px',
        marginRight: '18px',
        fontSize: '13.5px',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--accent-dark)' : 'var(--text-sub)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`未対応 ${badge} 件`}
          style={{
            background: 'var(--error)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '18px',
            height: '18px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}
    </button>
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
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18l5-5.5 3.5 3.5L20 8" />
        <circle cx="20" cy="8" r="1.6" fill="#fff" stroke="none" />
      </svg>
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0);
  return (
    <span
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
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Role } from '../types';
import { ROLE_LABELS } from '../types';
import {
  DEMO_COMPANY_USER,
  DEMO_CUSTOMER_ACCOUNT,
  DEMO_PARTNER_ACCOUNT,
} from '../data/sampleData';

interface LayoutProps {
  role: Role;
  onRoleChange: (r: Role) => void;
  children: React.ReactNode;
}

const ROLES: Role[] = ['company', 'customer', 'partner'];

function viewerContext(role: Role): { org: string; name: string; sub: string } {
  if (role === 'customer') {
    return { org: DEMO_CUSTOMER_ACCOUNT.company, name: `${DEMO_CUSTOMER_ACCOUNT.name} 様`, sub: DEMO_CUSTOMER_ACCOUNT.dept };
  }
  if (role === 'partner') {
    return { org: DEMO_PARTNER_ACCOUNT.company, name: DEMO_PARTNER_ACCOUNT.name, sub: '協力業者' };
  }
  return { org: DEMO_COMPANY_USER.company, name: DEMO_COMPANY_USER.name, sub: DEMO_COMPANY_USER.dept };
}

export function Layout({ role, onRoleChange, children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = viewerContext(role);
  const isList = location.pathname === '/' || location.pathname.startsWith('/order');
  const isCalendar = location.pathname === '/calendar';

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
        {/* 上段: ブランド・視点切替・利用者 */}
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
            aria-label="作業一覧へ"
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '11px', padding: 0 }}
          >
            <BrandMark />
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>
                作業予定管理システム
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                {DEMO_COMPANY_USER.company}
              </div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="role-switch" role="tablist" aria-label="表示視点の切替">
              {ROLES.map(r => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={role === r}
                  className={role === r ? 'active' : ''}
                  onClick={() => onRoleChange(r)}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.3 }} className="viewer-name">
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{ctx.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{ctx.org}</div>
              </div>
              <Avatar name={ctx.name} role={role} />
            </div>
          </div>
        </div>

        {/* 下段: ナビゲーション */}
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
            <NavItem label="作業一覧" active={isList} onClick={() => navigate('/')} />
            <NavItem label="作業カレンダー" active={isCalendar} onClick={() => navigate('/calendar')} />
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
        本画面はデモンストレーション用です。表示されている企業名・担当者名・作業内容はすべて架空のサンプルです。
      </footer>
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
      }}
    >
      {label}
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
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
        <path d="M8.5 14.5l2.2 2.2 4.3-4.6" />
      </svg>
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: Role }) {
  const bg = role === 'customer' ? 'var(--info)' : role === 'partner' ? 'var(--warning)' : 'var(--accent-dark)';
  const initial = name.trim().charAt(0);
  return (
    <span
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: bg,
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

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CURRENT_USER, OWN_COMPANY } from '../data/sampleData';

interface LayoutProps {
  children: React.ReactNode;
  /** ヘッダーの「使い方」からガイドツアーを開き直す */
  onOpenGuide: () => void;
}

const NAV = [
  { label: '工事案件の一覧', path: '/' },
  { label: '見積書を取り込む', path: '/import' },
  { label: '取引先', path: '/partners' },
];

export function Layout({ children, onOpenGuide }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/project');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <div className="app-header-inner app-header-top">
          <button className="brand" onClick={() => navigate('/')} aria-label="工事案件の一覧へ">
            <BrandMark />
            <span className="brand-text">
              <span className="brand-name">工事契約書類管理システム</span>
              <span className="brand-sub">
                {OWN_COMPANY.name} {OWN_COMPANY.division}
              </span>
            </span>
          </button>

          <div className="viewer">
            <button className="guide-open" onClick={onOpenGuide}>
              <span className="guide-open-mark" aria-hidden="true">?</span>
              使い方
            </button>
            <div className="viewer-name">
              <div className="viewer-name-main">{CURRENT_USER.name} さん</div>
              <div className="viewer-name-sub">{CURRENT_USER.department}</div>
            </div>
            <span className="viewer-avatar" aria-hidden="true">
              {CURRENT_USER.name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="app-nav-wrap">
          <nav className="app-header-inner app-nav" aria-label="メインメニュー">
            {NAV.map(n => (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                className={isActive(n.path) ? 'nav-item active' : 'nav-item'}
                aria-current={isActive(n.path) ? 'page' : undefined}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer no-print">
        本画面は提案用のデモンストレーションです。表示されている会社名・担当者名・工事内容・金額はすべて架空のサンプルです。
      </footer>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    </span>
  );
}

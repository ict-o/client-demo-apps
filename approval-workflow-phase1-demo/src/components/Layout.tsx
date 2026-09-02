import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Member } from '../types';
import { OPERATING_COMPANY, roleMeta } from '../data/sampleData';

interface LayoutProps {
  members: Member[];
  viewer: Member;
  onChangeViewer: (id: string) => void;
  /** ログアウトする */
  onLogout: () => void;
  /** 自分が承認できる件数。ナビのバッジに出す */
  myPendingCount: number;
  /** 署名手続き中の電子契約の件数。ナビのバッジに出す */
  esignPendingCount: number;
  /** ガイド付きツアーを開始する */
  onStartTour: () => void;
  children: React.ReactNode;
}

/** 管理者だけに表示するメニュー */
const ADMIN_ONLY = ['/users', '/settings'];

const NAV = [
  { path: '/requests', label: '申請一覧' },
  { path: '/esign', label: '電子契約' },
  { path: '/contracts', label: '契約書管理' },
  { path: '/register', label: '紙契約書の登録' },
  { path: '/accounting', label: '会計システム連携' },
  { path: '/users', label: '利用者・権限管理' },
  { path: '/settings', label: '承認ルート設定' },
  { path: '/guide', label: '操作ガイド' },
];

export function Layout({
  members,
  viewer,
  onChangeViewer,
  onLogout,
  myPendingCount,
  esignPendingCount,
  onStartTour,
  children,
}: LayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    path === '/requests'
      ? pathname === '/' || pathname === path || pathname.startsWith(`${path}/`)
      : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <button onClick={() => navigate('/requests')} aria-label="申請一覧へ移動" className="brand">
            <BrandMark />
            <span className="brand-text">
              <span className="brand-name">契約ワークフロー管理システム</span>
              <span className="brand-company">{OPERATING_COMPANY}</span>
            </span>
          </button>

          <div className="header-right">
            <button className="btn btn-secondary btn-sm tour-start" onClick={onStartTour}>
              操作ガイド（ツアー）
            </button>
            <label className="viewer-switch" data-tour="viewer-switch">
              <span className="viewer-switch-label">利用者</span>
              <select
                className="select"
                value={viewer.id}
                onChange={e => onChangeViewer(e.target.value)}
                aria-label="ログイン中の利用者を切り替える"
              >
                {members
                  .filter(m => m.active)
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.department} {m.title}　{m.name}（{roleMeta[m.role].label}）
                    </option>
                  ))}
              </select>
            </label>
            <Avatar name={viewer.name} />
            <button className="btn btn-secondary btn-sm" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </div>

        <div className="app-nav-wrap">
          <nav className="app-nav" aria-label="メインメニュー">
            {NAV.filter(item => viewer.role === 'admin' || !ADMIN_ONLY.includes(item.path)).map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              >
                {item.label}
                {item.path === '/requests' && myPendingCount > 0 && (
                  <span className="nav-badge" aria-label={`自分の承認待ち ${myPendingCount} 件`}>
                    {myPendingCount}
                  </span>
                )}
                {item.path === '/esign' && esignPendingCount > 0 && (
                  <span className="nav-badge" aria-label={`署名手続き中の電子契約 ${esignPendingCount} 件`}>
                    {esignPendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        本画面はデモンストレーション用です。表示されている企業名・担当者名・物件名・金額・契約内容はすべて架空のサンプルです。
      </footer>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3.5h8l4.5 4.5v12.5H6z" />
        <path d="M13.5 3.5V8H18" />
        <path d="M9.2 14.2l2.2 2.2 4.2-4.6" />
      </svg>
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name.trim().charAt(0)}
    </span>
  );
}

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Member } from '../types';
import { OPERATING_COMPANY } from '../data/sampleData';

interface LayoutProps {
  members: Member[];
  viewer: Member;
  onChangeViewer: (id: string) => void;
  /** 自分（または代理として）承認できる件数。ナビのバッジに出す */
  myPendingCount: number;
  /** 署名手続き中の電子契約の件数。ナビのバッジに出す */
  esignPendingCount: number;
  /** ガイド付きツアーを開始する */
  onStartTour: () => void;
  children: React.ReactNode;
}

const NAV = [
  { path: '/', label: '管理ダッシュボード' },
  { path: '/requests', label: '社内ワークフロー' },
  { path: '/esign', label: '電子契約' },
  { path: '/contracts', label: '契約台帳' },
  { path: '/import', label: '紙契約書取込' },
  { path: '/integrations', label: '会計システム連携' },
  { path: '/settings', label: '承認ルート設定' },
  { path: '/guide', label: '操作ガイド' },
];

export function Layout({
  members,
  viewer,
  onChangeViewer,
  myPendingCount,
  esignPendingCount,
  onStartTour,
  children,
}: LayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <button onClick={() => navigate('/')} aria-label="管理ダッシュボードへ移動" className="brand">
            <BrandMark />
            <span className="brand-text">
              <span className="brand-name">承認ワークフロー・電子契約管理システム</span>
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
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.department} {m.title}　{m.name}
                    {m.absent ? '（不在中）' : ''}
                  </option>
                ))}
              </select>
            </label>
            <Avatar name={viewer.name} />
          </div>
        </div>

        <div className="app-nav-wrap">
          <nav className="app-nav" aria-label="メインメニュー">
            {NAV.map(item => (
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

import { useMemo, useState } from 'react';
import type { Member, Role } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { departments, permissionRows, roleMeta } from '../data/sampleData';
import { formatDateTime } from '../utils/format';

interface UserAdminProps {
  members: Member[];
  viewer: Member;
  actions: AppActions;
}

const ROLE_ORDER: Role[] = ['admin', 'approver', 'applicant', 'viewer'];

const ROLE_TONE: Record<Role, string> = {
  admin: 'accent',
  approver: 'info',
  applicant: 'success',
  viewer: 'muted',
};

/** 利用者・組織・権限管理（システム管理者のみ利用できる） */
export function UserAdmin({ members, viewer, actions }: UserAdminProps) {
  const [keyword, setKeyword] = useState('');
  const [dept, setDept] = useState('すべて');

  const rows = useMemo(() => {
    const kw = keyword.trim();
    return members.filter(m => {
      if (dept !== 'すべて' && m.department !== dept) return false;
      if (kw !== '' && !`${m.name} ${m.loginId} ${m.email} ${m.title} ${m.department}`.includes(kw)) return false;
      return true;
    });
  }, [members, keyword, dept]);

  if (viewer.role !== 'admin') {
    return (
      <div className="card">
        <EmptyState
          title="この画面を表示する権限がありません"
          desc="利用者・組織・権限管理はシステム管理者のみが利用できます。画面右上の利用者切替でシステム管理者に切り替えると表示されます。"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">利用者・組織・権限管理</h1>
          <p className="page-sub">
            利用者アカウントの権限と有効・無効を管理します。権限を変更すると、その利用者が使えるメニューと操作がすぐに変わります。
          </p>
        </div>
      </div>

      <div className="kpi-row">
        {ROLE_ORDER.map(r => (
          <div key={r} className="kpi">
            <div className="kpi-label">{roleMeta[r].label}</div>
            <div className="kpi-value">
              {members.filter(m => m.role === r && m.active).length}
              <span className="kpi-unit">名</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad mt-16" data-tour="departments">
        <div className="section-title">組織（部門）</div>
        <div className="table-wrap mt-16">
          <table className="data">
            <thead>
              <tr>
                <th>部門</th>
                <th className="num">所属人数</th>
                <th>役割</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td className="fw-600">{d.name}</td>
                  <td className="num">{members.filter(m => m.department === d.name).length} 名</td>
                  <td className="fs-13 text-sub">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad mt-16" data-tour="user-list">
        <div className="section-title">利用者アカウント</div>

        <div className="filter-bar mt-16">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <label className="field-label" htmlFor="user-search" style={{ position: 'absolute', left: '-9999px' }}>
              利用者の検索
            </label>
            <input
              id="user-search"
              className="input"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="氏名・ログインID・部門で検索"
            />
          </div>
          <label className="field-label" htmlFor="user-dept" style={{ position: 'absolute', left: '-9999px' }}>
            部門で絞り込む
          </label>
          <select id="user-dept" className="select" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="すべて">すべての部門</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <span className="fs-13 text-sub">{rows.length} 名を表示</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="該当する利用者はいません" desc="検索条件や部門の絞り込みを変更してください。" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>氏名 / ログインID</th>
                  <th>所属・役職</th>
                  <th>権限</th>
                  <th>状態</th>
                  <th>最終ログイン</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="fw-600">{m.name}</div>
                      <div className="fs-12 text-sub">
                        {m.loginId}／{m.email}
                      </div>
                    </td>
                    <td className="fs-13">
                      {m.department}
                      <div className="fs-12 text-sub">{m.title}</div>
                    </td>
                    <td>
                      <label className="field-label" htmlFor={`role-${m.id}`} style={{ position: 'absolute', left: '-9999px' }}>
                        {m.name} の権限
                      </label>
                      <select
                        id={`role-${m.id}`}
                        className="select"
                        value={m.role}
                        disabled={m.id === viewer.id}
                        title={m.id === viewer.id ? 'ログイン中の自分の権限は変更できません' : undefined}
                        onChange={e => actions.setMemberRole(m.id, e.target.value as Role)}
                      >
                        {ROLE_ORDER.map(r => (
                          <option key={r} value={r}>
                            {roleMeta[r].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Badge tone={m.active ? 'success' : 'muted'} label={m.active ? '有効' : '無効'} />
                    </td>
                    <td className="fs-13">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : '—'}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => actions.setMemberActive(m.id, !m.active)}
                        disabled={m.id === viewer.id}
                        title={m.id === viewer.id ? 'ログイン中の自分のアカウントは無効にできません' : undefined}
                      >
                        {m.active ? '無効にする' : '有効にする'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="fs-12 text-muted mt-16">
          ログイン中の自分のアカウントは、権限の変更と無効化ができません。無効にしたアカウントではログインできず、画面右上の利用者切替にも表示されません。
        </p>
      </div>

      <div className="card card-pad mt-16" data-tour="permission-matrix">
        <div className="section-title">権限でできること</div>
        <div className="table-wrap mt-16">
          <table className="data">
            <thead>
              <tr>
                <th>機能</th>
                {ROLE_ORDER.map(r => (
                  <th key={r} style={{ textAlign: 'center' }}>
                    {roleMeta[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionRows.map(row => (
                <tr key={row.feature}>
                  <td className="fs-13">{row.feature}</td>
                  {ROLE_ORDER.map(r => (
                    <td key={r} style={{ textAlign: 'center' }} className={row.allow[r] ? '' : 'text-muted'}>
                      {row.allow[r] ? '○' : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="two-col mt-16">
          {ROLE_ORDER.map(r => (
            <div key={r} className="mini-case">
              <div className="row gap-6">
                <Badge tone={ROLE_TONE[r]} label={roleMeta[r].label} />
              </div>
              <p className="fs-13 text-sub mt-4">{roleMeta[r].desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

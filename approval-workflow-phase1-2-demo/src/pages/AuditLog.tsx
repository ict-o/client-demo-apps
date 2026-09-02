import { useMemo, useState } from 'react';
import type { AuditCategory, Member, SystemAuditLog } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/format';

interface AuditLogProps {
  logs: SystemAuditLog[];
  viewer: Member;
}

const CATEGORIES: (AuditCategory | 'all')[] = ['all', '認証', '権限', '申請', '電子契約', '契約書', '外部連携'];

const CATEGORY_TONE: Record<AuditCategory, string> = {
  認証: 'info',
  権限: 'accent',
  申請: 'warning',
  電子契約: 'success',
  契約書: 'muted',
  外部連携: 'info',
};

/** 監査ログ（システム全体の操作証跡）。システム管理者のみ閲覧できる */
export function AuditLog({ logs, viewer }: AuditLogProps) {
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);

  const rows = useMemo(() => {
    const kw = keyword.trim();
    return logs.filter(l => {
      if (category !== 'all' && l.category !== category) return false;
      if (failedOnly && l.result !== '失敗') return false;
      if (kw !== '' && !`${l.actor} ${l.action} ${l.target ?? ''} ${l.ip} ${l.device}`.includes(kw)) return false;
      return true;
    });
  }, [category, failedOnly, keyword, logs]);

  const failedCount = logs.filter(l => l.result === '失敗').length;

  if (viewer.role !== 'admin') {
    return (
      <div className="card">
        <EmptyState
          title="この画面を表示する権限がありません"
          desc="監査ログはシステム管理者のみが閲覧できます。画面右上の利用者切替でシステム管理者に切り替えると表示されます。"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">監査ログ</h1>
          <p className="page-sub">
            ログイン・権限変更・承認・電子契約・契約書登録・CSV出力の操作を、実行者・日時・アクセス元とあわせて記録します。記録は変更・削除できません。
          </p>
        </div>
      </div>

      <div className="kpi-row" data-tour="audit-kpi">
        <div className="kpi accent-info">
          <div className="kpi-label">記録件数</div>
          <div className="kpi-value">
            {logs.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">失敗した操作</div>
          <div className={`kpi-value${failedCount > 0 ? ' error' : ''}`}>
            {failedCount}
            <span className="kpi-unit">件</span>
          </div>
          <div className="kpi-note">ログイン失敗などを含みます</div>
        </div>
        <div className="kpi accent-accent">
          <div className="kpi-label">権限の変更</div>
          <div className="kpi-value">
            {logs.filter(l => l.category === '権限').length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">最終記録</div>
          <div className="kpi-value" style={{ fontSize: '15px', lineHeight: 1.5 }}>
            {logs[0] ? formatDateTime(logs[0].at) : '—'}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label className="field-label" htmlFor="audit-search" style={{ position: 'absolute', left: '-9999px' }}>
            監査ログの検索
          </label>
          <input
            id="audit-search"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="担当者名・操作内容・対象番号・IPアドレスで検索"
          />
        </div>
        <select
          className="select"
          style={{ width: 'auto' }}
          value={category}
          onChange={e => setCategory(e.target.value as AuditCategory | 'all')}
          aria-label="区分で絞り込む"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? '区分: すべて' : `区分: ${c}`}
            </option>
          ))}
        </select>
        <label className="check-row" htmlFor="audit-failed" style={{ padding: 0, border: 'none' }}>
          <input
            id="audit-failed"
            type="checkbox"
            checked={failedOnly}
            onChange={e => setFailedOnly(e.target.checked)}
          />
          <span className="fs-13">失敗した操作のみ表示</span>
        </label>
        <span className="fs-13 text-sub">{rows.length} 件を表示</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState title="該当する記録はありません" desc="区分や検索条件を変更してお試しください。" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>日時</th>
                <th>区分</th>
                <th>操作者</th>
                <th>操作内容</th>
                <th>対象</th>
                <th>アクセス元</th>
                <th>結果</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(l => (
                <tr key={l.id}>
                  <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>
                    {formatDateTime(l.at)}
                  </td>
                  <td>
                    <Badge tone={CATEGORY_TONE[l.category]} label={l.category} />
                  </td>
                  <td className="fs-13">{l.actor}</td>
                  <td className="fs-13">{l.action}</td>
                  <td className="fs-13">{l.target ?? '—'}</td>
                  <td className="fs-13">
                    {l.ip}
                    <div className="fs-12 text-sub">{l.device}</div>
                  </td>
                  <td>
                    <Badge tone={l.result === '成功' ? 'success' : 'error'} label={l.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card card-pad mt-16">
        <div className="section-title">
          <span className="bar" />
          セキュリティに関する扱い
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="k">記録の保持</div>
            <div className="v">記録は追記のみで、画面からの編集・削除はできません</div>
          </div>
          <div className="info-item">
            <div className="k">閲覧できる利用者</div>
            <div className="v">システム管理者のみ（他の権限ではメニューに表示されません）</div>
          </div>
          <div className="info-item">
            <div className="k">記録する内容</div>
            <div className="v">日時・操作者・操作内容・対象・アクセス元（IPアドレス／端末）・成否</div>
          </div>
          <div className="info-item">
            <div className="k">電子契約の証跡</div>
            <div className="v">締結案件ごとの詳細な証跡は、電子契約の詳細画面と合意締結証明書で確認できます</div>
          </div>
        </div>
      </div>
    </div>
  );
}

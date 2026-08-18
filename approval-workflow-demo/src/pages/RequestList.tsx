import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member, Request } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { canAct, currentStep, requestStatusMeta, stagnantDays } from '../utils/domain';
import { formatDate, formatYen } from '../utils/format';

interface RequestListProps {
  requests: Request[];
  members: Member[];
  viewer: Member;
}

type StatusFilter = 'all' | 'mine' | 'pending' | 'approved' | 'completed' | 'rejected';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'mine', label: '自分の承認待ち' },
  { key: 'pending', label: '承認待ち' },
  { key: 'approved', label: '承認済（締結待ち）' },
  { key: 'completed', label: '締結完了' },
  { key: 'rejected', label: '差戻し' },
];

export function RequestList({ requests, members, viewer }: RequestListProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<StatusFilter>('all');
  const [kind, setKind] = useState<'all' | 'ringi' | 'seal'>('all');
  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const kw = keyword.trim();
    return requests.filter(r => {
      if (tab === 'mine' && !canAct(r, viewer, members).ok) return false;
      if (tab !== 'all' && tab !== 'mine' && r.status !== tab) return false;
      if (kind !== 'all' && r.kind !== kind) return false;
      if (kw !== '') {
        const hay = `${r.code} ${r.title} ${r.counterparty} ${r.property ?? ''} ${r.contractType}`;
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [requests, tab, kind, keyword, viewer, members]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">申請一覧（稟議書・捺印申請）</h1>
          <p className="page-sub">申請の回覧状況を一覧で確認できます。行をクリックすると詳細と承認操作に進みます。</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/requests/new')}>
          新規申請を作成
        </button>
      </div>

      <div className="tabs">
        {STATUS_TABS.map(t => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <label className="field-label" htmlFor="req-search" style={{ position: 'absolute', left: '-9999px' }}>
            申請の検索
          </label>
          <input
            id="req-search"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="申請番号・件名・相手先・物件で検索"
          />
        </div>
        <select className="select" value={kind} onChange={e => setKind(e.target.value as typeof kind)} aria-label="申請種別で絞り込む" style={{ width: 'auto' }}>
          <option value="all">種別: すべて</option>
          <option value="ringi">種別: 稟議書</option>
          <option value="seal">種別: 捺印申請</option>
        </select>
        <span className="fs-13 text-sub">{rows.length} 件を表示</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState title="該当する申請はありません" desc="検索条件・絞り込みを変更してお試しください。" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>申請番号</th>
                <th>種別</th>
                <th>件名 / 相手先</th>
                <th className="num">金額</th>
                <th>申請日</th>
                <th>現在の段階</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const step = currentStep(r);
                const approver = members.find(m => m.id === step?.approverId);
                const meta = requestStatusMeta(r.status);
                const days = stagnantDays(r);
                const act = canAct(r, viewer, members);
                return (
                  <tr key={r.id} className="clickable" onClick={() => navigate(`/requests/${r.id}`)}>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.code}</td>
                    <td>
                      <span className="tag">{r.kind === 'seal' ? '捺印申請' : '稟議書'}</span>
                    </td>
                    <td>
                      <div className="fw-600">{r.title}</div>
                      <div className="fs-12 text-sub">
                        {r.counterparty}／{r.contractType}
                      </div>
                    </td>
                    <td className="num">{formatYen(r.amount)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.appliedAt.slice(0, 10))}</td>
                    <td>
                      {step ? (
                        <div>
                          <div className="fs-13">{step.name}</div>
                          <div className="fs-12 text-sub">
                            {approver?.name}
                            {approver?.absent && '（不在中）'}
                            {days >= 3 && <span style={{ color: 'var(--error)', fontWeight: 600 }}>／{days}日滞留</span>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted fs-13">—</span>
                      )}
                    </td>
                    <td>
                      <div className="row gap-6 wrap">
                        <Badge tone={meta.tone} label={meta.label} />
                        {act.ok && <Badge tone="accent" label="要対応" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

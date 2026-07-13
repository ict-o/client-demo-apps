import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Case, CaseStatus } from '../types';
import { CASE_STATUS_LABELS, CASE_STATUS_TONE } from '../types';
import { caseStatus, progressPercent } from '../utils/domain';
import { formatDate, formatYen } from '../utils/format';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';

const STATUS_OPTIONS: { value: CaseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべての状態' },
  { value: 'active', label: '順調' },
  { value: 'attention', label: '要確認' },
  { value: 'delayed', label: '遅延' },
  { value: 'done', label: '完了' },
];

export function CaseList({ cases }: { cases: Case[] }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<CaseStatus | 'all'>('all');
  const [owner, setOwner] = useState('all');

  const owners = useMemo(() => Array.from(new Set(cases.map(c => c.owner))).sort(), [cases]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return cases.filter(c => {
      const st = caseStatus(c.checkpoints);
      if (status !== 'all' && st !== status) return false;
      if (owner !== 'all' && c.owner !== owner) return false;
      if (kw) {
        const hay = `${c.title} ${c.client} ${c.code}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [cases, keyword, status, owner]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">案件一覧</div>
          <div className="page-sub">受注案件の進捗状況を一覧で監視します。行をクリックすると確認事項の詳細を表示します</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>＋ 新規案件登録</button>
      </div>

      <div className="filter-bar">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="input"
            type="search"
            placeholder="案件名・顧客名・案件番号で検索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            aria-label="案件を検索"
          />
        </div>
        <select className="select" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value as CaseStatus | 'all')} aria-label="状態で絞り込み">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={owner} onChange={e => setOwner(e.target.value)} aria-label="担当者で絞り込み">
          <option value="all">すべての担当者</option>
          {owners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="fs-12 text-sub mb-8">{filtered.length} 件を表示中（全 {cases.length} 件）</div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title="該当する案件はありません" desc="検索条件や絞り込みを変更してください。" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>案件番号</th>
                <th>案件名 / 顧客</th>
                <th>担当</th>
                <th style={{ minWidth: '150px' }}>進捗</th>
                <th>状態</th>
                <th>完了期限</th>
                <th className="num">受注金額</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const st = caseStatus(c.checkpoints);
                return (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/cases/${c.id}`)}>
                    <td><span className="tag">{c.code}</span></td>
                    <td>
                      <div className="fw-600">{c.title}</div>
                      <div className="fs-12 text-sub">{c.client}</div>
                    </td>
                    <td>{c.owner}<div className="fs-12 text-sub">{c.department}</div></td>
                    <td><ProgressBar percent={progressPercent(c.checkpoints)} status={st} /></td>
                    <td><Badge tone={CASE_STATUS_TONE[st]} label={CASE_STATUS_LABELS[st]} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(c.dueDate)}</td>
                    <td className="num">{formatYen(c.amount)}</td>
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

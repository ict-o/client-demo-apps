import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Envelope } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { deadlineDays, envelopeStatusMeta, isInProgress, nextSigner, signProgress } from '../utils/esign';
import { formatDate, formatDateTime, formatYen } from '../utils/format';

interface EsignListProps {
  envelopes: Envelope[];
}

type TabKey = 'progress' | 'completed' | 'stopped' | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'progress', label: '進行中（署名待ち）' },
  { key: 'completed', label: '締結済' },
  { key: 'stopped', label: '中止・期限切れ' },
  { key: 'all', label: 'すべて' },
];

export function EsignList({ envelopes }: EsignListProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('progress');
  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const kw = keyword.trim();
    return envelopes
      .filter(e => {
        if (tab === 'progress' && !isInProgress(e)) return false;
        if (tab === 'completed' && e.status !== 'completed') return false;
        if (tab === 'stopped' && !['declined', 'canceled', 'expired'].includes(e.status)) return false;
        if (kw !== '') {
          const hay = `${e.code} ${e.title} ${e.counterparty} ${e.contractType} ${e.property} ${e.signers
            .map(s => s.name)
            .join(' ')}`;
          if (!hay.includes(kw)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (isInProgress(a) && isInProgress(b)) return a.deadline.localeCompare(b.deadline);
        return b.sentAt.localeCompare(a.sentAt);
      });
  }, [envelopes, tab, keyword]);

  const inProgress = envelopes.filter(isInProgress);
  const dueSoon = inProgress.filter(e => deadlineDays(e) >= 0 && deadlineDays(e) <= 3);
  const overdue = envelopes.filter(e => e.status === 'expired' || (isInProgress(e) && deadlineDays(e) < 0));
  const waitingUs = inProgress.filter(e => nextSigner(e)?.side === 'internal');

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">電子契約</h1>
          <p className="page-sub">
            承認が完了した契約を電子署名で締結します。署名依頼の送信・署名状況の確認・リマインド・締結証明までを本システム内で完結します。
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/esign/new')}>
          電子契約を新規作成
        </button>
      </div>

      <div className="kpi-row" data-tour="esign-list">
        <div className="kpi accent-info">
          <div className="kpi-label">進行中（署名待ち）</div>
          <div className="kpi-value">
            {inProgress.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-warning">
          <div className="kpi-label">当社の署名待ち</div>
          <div className={`kpi-value${waitingUs.length > 0 ? ' warning' : ''}`}>
            {waitingUs.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-warning">
          <div className="kpi-label">署名期限まで3日以内</div>
          <div className={`kpi-value${dueSoon.length > 0 ? ' warning' : ''}`}>
            {dueSoon.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">期限切れ</div>
          <div className={`kpi-value${overdue.length > 0 ? ' error' : ''}`}>
            {overdue.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
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
          <label className="field-label" htmlFor="es-search" style={{ position: 'absolute', left: '-9999px' }}>
            電子契約の検索
          </label>
          <input
            id="es-search"
            className="input"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="管理番号・契約内容・相手先企業名・署名者名で検索"
          />
        </div>
        <span className="fs-13 text-sub">{rows.length} 件を表示</span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="該当する電子契約はありません"
            desc="タブや検索条件を変更するか、承認済の申請から新しい電子契約を作成してください。"
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>管理番号</th>
                <th>契約内容 / 相手先</th>
                <th className="num">契約金額</th>
                <th>署名の進捗</th>
                <th>次の署名者</th>
                <th>署名期限</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(e => {
                const meta = envelopeStatusMeta(e.status);
                const prog = signProgress(e);
                const next = nextSigner(e);
                const rest = deadlineDays(e);
                return (
                  <tr key={e.id} className="clickable" onClick={() => navigate(`/esign/${e.id}`)}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{e.code}</div>
                      <div className="fs-12 text-sub">送信 {formatDateTime(e.sentAt)}</div>
                    </td>
                    <td>
                      <div className="fw-600">{e.title}</div>
                      <div className="fs-12 text-sub">
                        {e.counterparty}／{e.contractType}
                        {e.requestCode ? `／申請 ${e.requestCode}` : ''}
                      </div>
                    </td>
                    <td className="num">{formatYen(e.amount)}</td>
                    <td style={{ minWidth: '132px' }}>
                      <div className="progress">
                        <span style={{ width: `${prog.percent}%` }} />
                      </div>
                      <div className="fs-12 text-sub mt-4">
                        {prog.signed} / {prog.total} 名が署名済
                      </div>
                    </td>
                    <td className="fs-13">
                      {next ? (
                        <>
                          <div>{next.name}</div>
                          <div className="fs-12 text-sub">
                            {next.side === 'internal' ? '当社' : next.company}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>
                      <div>{formatDate(e.deadline)}</div>
                      {isInProgress(e) && (
                        <div className={`fs-12 ${rest < 0 ? 'text-error' : 'text-sub'}`}>
                          {rest >= 0 ? `あと${rest}日` : `${-rest}日超過`}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="row gap-6 wrap">
                        <Badge tone={meta.tone} label={meta.label} />
                        {e.reminderCount > 0 && isInProgress(e) && (
                          <span className="tag">リマインド{e.reminderCount}回</span>
                        )}
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

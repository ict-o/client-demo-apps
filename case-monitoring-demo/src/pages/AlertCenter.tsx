import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Alert, AlertStatus } from '../types';
import type { AppActions } from '../App';
import { AlertRow } from '../components/AlertRow';
import { EmptyState } from '../components/EmptyState';

type Filter = AlertStatus | 'all';

const TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未対応' },
  { value: 'ack', label: '確認済' },
  { value: 'resolved', label: '対応済' },
];

export function AlertCenter({ alerts, actions }: { alerts: Alert[]; actions: AppActions }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => ({
    all: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    ack: alerts.filter(a => a.status === 'ack').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }), [alerts]);

  const list = useMemo(
    () => [...alerts]
      .filter(a => filter === 'all' || a.status === filter)
      .sort((a, b) => b.at.localeCompare(a.at)),
    [alerts, filter],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">アラート</div>
          <div className="page-sub">遅延・不備・期限接近の通知を一覧で管理します。対応状況を更新できます</div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.value} className={`tab ${filter === t.value ? 'active' : ''}`} onClick={() => setFilter(t.value)}>
            {t.label}（{counts[t.value]}）
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            title={filter === 'all' ? 'アラートはありません' : '該当するアラートはありません'}
            desc="遅延・不備・期限接近が検知されると通知が届きます。"
          />
        </div>
      ) : (
        <div className="stack gap-10">
          {list.map(a => (
            <AlertRow
              key={a.id}
              alert={a}
              actions={
                <div className="row gap-8 wrap" style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/cases/${a.caseId}`)}>案件を見る ›</button>
                  {a.status === 'open' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => actions.setAlertStatus(a.id, 'ack')}>確認済にする</button>
                  )}
                  {a.status !== 'resolved' && (
                    <button className="btn btn-success btn-sm" onClick={() => actions.setAlertStatus(a.id, 'resolved')}>対応済にする</button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import type { Alert, Case } from '../types';
import { CASE_STATUS_LABELS, CASE_STATUS_TONE } from '../types';
import { caseStatus, progressPercent, needsAttention, nextCheckpoint } from '../utils/domain';
import { formatDate, formatYen } from '../utils/format';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { AlertRow } from '../components/AlertRow';
import { EmptyState } from '../components/EmptyState';

interface DashboardProps {
  cases: Case[];
  alerts: Alert[];
}

export function Dashboard({ cases, alerts }: DashboardProps) {
  const navigate = useNavigate();

  const active = cases.filter(c => caseStatus(c.checkpoints) !== 'done');
  const delayed = cases.filter(c => caseStatus(c.checkpoints) === 'delayed');
  const attention = cases.filter(c => caseStatus(c.checkpoints) === 'attention');
  const openAlerts = alerts.filter(a => a.status === 'open');

  const feed = [...alerts].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const watchlist = cases
    .filter(needsAttention)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="live-dot" aria-hidden="true" />
            監視ダッシュボード
          </div>
          <div className="page-sub">受注案件の確認事項をリアルタイムで監視し、遅延・不備を検知して通知します</div>
        </div>
        <div className="row gap-8 wrap">
          <button className="btn btn-secondary" onClick={() => navigate('/cases')}>案件一覧</button>
          <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>＋ 新規案件登録</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi accent-info">
          <div className="kpi-label">監視中の案件</div>
          <div className="kpi-value">{active.length}<span className="kpi-unit">件</span></div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">遅延中の案件</div>
          <div className={`kpi-value ${delayed.length ? 'error' : ''}`}>{delayed.length}<span className="kpi-unit">件</span></div>
        </div>
        <div className="kpi accent-warning">
          <div className="kpi-label">要確認の案件</div>
          <div className={`kpi-value ${attention.length ? 'warning' : ''}`}>{attention.length}<span className="kpi-unit">件</span></div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">未対応アラート</div>
          <div className={`kpi-value ${openAlerts.length ? 'error' : ''}`}>{openAlerts.length}<span className="kpi-unit">件</span></div>
        </div>
      </div>

      <div className="two-col">
        <section className="card card-pad">
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="bar" />リアルタイム通知
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>すべて表示 ›</button>
          </div>
          {feed.length === 0 ? (
            <EmptyState title="通知はありません" desc="遅延・不備・期限接近が検知されるとここに表示されます。" />
          ) : (
            <div className="stack gap-10">
              {feed.map(a => (
                <AlertRow key={a.id} alert={a} onClick={() => navigate(`/cases/${a.caseId}`)} />
              ))}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <div className="section-title"><span className="bar" />対応が必要な案件</div>
          {watchlist.length === 0 ? (
            <EmptyState title="対応が必要な案件はありません" desc="すべての案件が順調に進行しています。" />
          ) : (
            <div className="stack gap-10">
              {watchlist.map(c => {
                const st = caseStatus(c.checkpoints);
                const next = nextCheckpoint(c.checkpoints);
                return (
                  <button key={c.id} className="mini-case" onClick={() => navigate(`/cases/${c.id}`)}>
                    <div className="row gap-8 wrap" style={{ justifyContent: 'space-between' }}>
                      <span className="fw-600 fs-13">{c.title}</span>
                      <Badge tone={CASE_STATUS_TONE[st]} label={CASE_STATUS_LABELS[st]} />
                    </div>
                    <div className="fs-12 text-sub">{c.client}・担当 {c.owner}</div>
                    <ProgressBar percent={progressPercent(c.checkpoints)} status={st} />
                    {next && (
                      <div className="fs-12 text-muted">
                        次の確認事項：{next.name}（期限 {formatDate(next.dueDate)}）
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div style={{ marginTop: '22px' }}>
        <div className="section-title"><span className="bar" />受注金額サマリ（監視中）</div>
        <div className="card card-pad">
          <div className="info-grid">
            <div className="info-item">
              <div className="k">監視中の受注総額</div>
              <div className="v" style={{ fontWeight: 700 }}>
                {formatYen(active.reduce((s, c) => s + c.amount, 0))}
              </div>
            </div>
            <div className="info-item">
              <div className="k">遅延案件の受注額</div>
              <div className="v" style={{ fontWeight: 700, color: 'var(--error)' }}>
                {formatYen(delayed.reduce((s, c) => s + c.amount, 0))}
              </div>
            </div>
            <div className="info-item">
              <div className="k">完了済みの案件</div>
              <div className="v" style={{ fontWeight: 700 }}>
                {cases.filter(c => caseStatus(c.checkpoints) === 'done').length} 件
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

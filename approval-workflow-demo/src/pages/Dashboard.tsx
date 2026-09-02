import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Contract, Envelope, Member, Request } from '../types';
import { monthlyVolume } from '../data/sampleData';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { canAct, contractPhase, contractPhaseMeta, currentStep, stagnantDays } from '../utils/domain';
import { deadlineDays, envelopeStatusMeta, isInProgress, nextSigner, signProgress } from '../utils/esign';
import { daysUntil, formatDate, formatYen } from '../utils/format';

interface DashboardProps {
  requests: Request[];
  contracts: Contract[];
  envelopes: Envelope[];
  members: Member[];
  viewer: Member;
}

export function Dashboard({ requests, contracts, envelopes, members, viewer }: DashboardProps) {
  const navigate = useNavigate();

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const mine = useMemo(() => pending.filter(r => canAct(r, viewer, members).ok), [pending, viewer, members]);
  const stagnant = useMemo(
    () => pending.filter(r => stagnantDays(r) >= 3).sort((a, b) => stagnantDays(b) - stagnantDays(a)),
    [pending],
  );
  const expiring = useMemo(
    () =>
      contracts
        .filter(c => contractPhase(c) !== 'active')
        .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate)),
    [contracts],
  );
  const absentMembers = useMemo(() => members.filter(m => m.absent), [members]);
  const signing = useMemo(
    () => envelopes.filter(isInProgress).sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [envelopes],
  );
  const signingOurTurn = useMemo(() => signing.filter(e => nextSigner(e)?.side === 'internal'), [signing]);

  const pendingSorted = useMemo(
    () => [...pending].sort((a, b) => stagnantDays(b) - stagnantDays(a)),
    [pending],
  );

  const maxVolume = Math.max(...monthlyVolume.map(v => v.paper + v.digital));
  const latest = monthlyVolume[monthlyVolume.length - 1];
  const digitalRate = Math.round((latest.digital / (latest.paper + latest.digital)) * 100);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">管理ダッシュボード</h1>
          <p className="page-sub">
            {viewer.name} さん（{viewer.department} {viewer.title}）の承認待ちと、契約期限の状況をまとめて確認できます。
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/requests/new')}>
          新規申請を作成
        </button>
      </div>

      {absentMembers.length > 0 && (
        <div className="banner info">
          <span aria-hidden="true">🔁</span>
          <div>
            <strong>不在時の自動引き継ぎが有効です。</strong>
            {absentMembers.map(m => {
              const d = members.find(x => x.id === m.delegateId);
              return (
                <span key={m.id}>
                  {' '}
                  {m.name}（{m.department} {m.title}）は不在中のため、承認は代理承認者の {d ? d.name : '未設定'} へ引き継がれます。
                </span>
              );
            })}
            <button className="btn btn-ghost btn-sm mt-8" onClick={() => navigate('/settings')}>
              不在・代理承認者の設定を開く
            </button>
          </div>
        </div>
      )}

      <div className="kpi-row" data-tour="kpi">
        <button className="kpi accent-info" onClick={() => navigate('/requests')} style={{ textAlign: 'left' }}>
          <div className="kpi-label">自分が承認する申請</div>
          <div className="kpi-value">
            {mine.length}
            <span className="kpi-unit">件</span>
          </div>
        </button>
        <div className="kpi">
          <div className="kpi-label">承認待ち（全社）</div>
          <div className="kpi-value">
            {pending.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">3日以上滞留</div>
          <div className={`kpi-value${stagnant.length > 0 ? ' error' : ''}`}>
            {stagnant.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <button className="kpi accent-accent" onClick={() => navigate('/esign')} style={{ textAlign: 'left' }}>
          <div className="kpi-label">電子契約 署名待ち</div>
          <div className="kpi-value">
            {signing.length}
            <span className="kpi-unit">件</span>
          </div>
          <div className="kpi-note">うち当社の署名待ち {signingOurTurn.length} 件</div>
        </button>
        <div className="kpi accent-warning">
          <div className="kpi-label">更新期限60日以内の契約</div>
          <div className={`kpi-value${expiring.length > 0 ? ' warning' : ''}`}>
            {expiring.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            承認待ちの申請（滞留日数の長い順）
          </div>
          {pendingSorted.length === 0 ? (
            <EmptyState title="承認待ちの申請はありません" desc="新しい申請が回覧されるとここに表示されます。" />
          ) : (
            <div className="stack gap-10">
              {pendingSorted.map(r => {
                const step = currentStep(r);
                const approver = members.find(m => m.id === step?.approverId);
                const days = stagnantDays(r);
                const act = canAct(r, viewer, members);
                return (
                  <button
                    key={r.id}
                    className={`alert-item${days >= 3 ? ' level-high' : ''}`}
                    onClick={() => navigate(`/requests/${r.id}`)}
                  >
                    <span className={`alert-icn ${days >= 3 ? 'stagnant' : 'waiting'}`} aria-hidden="true">
                      {days}日
                    </span>
                    <span className="alert-body">
                      <span className="alert-title-row">
                        <span className="alert-case">{r.title}</span>
                        <span className="tag">{r.code}</span>
                        {act.ok && <Badge tone="warning" label="自分の承認待ち" />}
                      </span>
                      <span className="alert-msg">
                        現在の段階: {step?.name}／承認者: {approver?.name}
                        {approver?.absent && '（不在中・代理承認可）'}／{formatYen(r.amount)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            更新期限が近い契約
          </div>
          {expiring.length === 0 ? (
            <EmptyState title="期限が近い契約はありません" desc="更新期限60日以内の契約が対象です。" />
          ) : (
            <div className="stack gap-10">
              {expiring.map(c => {
                const meta = contractPhaseMeta(contractPhase(c));
                const rest = daysUntil(c.endDate);
                return (
                  <button key={c.id} className="mini-case" onClick={() => navigate(`/contracts/${c.id}`)}>
                    <span className="row gap-8 wrap">
                      <Badge tone={meta.tone} label={meta.label} />
                      <span className="fs-12 text-muted">{c.code}</span>
                    </span>
                    <span className="fs-13 fw-600">{c.title}</span>
                    <span className="fs-12 text-sub">
                      {c.counterparty}／満了 {formatDate(c.endDate)}
                      {rest >= 0 ? `（あと${rest}日）` : `（${-rest}日超過）`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="card card-pad mt-20">
        <div className="section-title">
          <span className="bar" />
          電子契約の進行状況（署名期限が近い順）
        </div>
        {signing.length === 0 ? (
          <EmptyState
            title="署名待ちの電子契約はありません"
            desc="承認が完了した申請から電子契約を送信すると、ここに進捗が表示されます。"
          />
        ) : (
          <div className="stack gap-10">
            {signing.map(e => {
              const rest = deadlineDays(e);
              const prog = signProgress(e);
              const next = nextSigner(e);
              const sm = envelopeStatusMeta(e.status);
              return (
                <button key={e.id} className="mini-case" onClick={() => navigate(`/esign/${e.id}`)}>
                  <span className="row gap-8 wrap">
                    <Badge tone={rest < 0 ? 'error' : sm.tone} label={rest < 0 ? '期限超過' : sm.label} />
                    <span className="fs-12 text-muted">{e.code}</span>
                    {next?.side === 'internal' && <Badge tone="warning" label="当社の署名待ち" />}
                  </span>
                  <span className="fs-13 fw-600">{e.title}</span>
                  <span className="fs-12 text-sub">
                    {e.counterparty}／{prog.signed}/{prog.total} 名署名済／次は {next?.name ?? '—'}／期限{' '}
                    {formatDate(e.deadline)}
                    {rest >= 0 ? `（あと${rest}日）` : `（${-rest}日超過）`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card card-pad mt-20">
        <div className="section-title">
          <span className="bar" />
          月間承認処理件数の推移（紙／電子）
        </div>
        <p className="fs-13 text-sub mb-12">
          今月の電子化率は <strong>{digitalRate}%</strong>（電子 {latest.digital} 件／紙 {latest.paper} 件）です。
          月間 100〜150 件の承認処理のうち、電子で処理した件数の割合を示しています。
        </p>
        <div className="vbars">
          {monthlyVolume.map(v => (
            <div className="vbar-col" key={v.month}>
              <div className="vbar-stack">
                <span
                  className="vbar-seg digital"
                  style={{ height: `${(v.digital / maxVolume) * 100}%` }}
                  title={`${v.month} 電子 ${v.digital}件`}
                />
                <span
                  className="vbar-seg paper"
                  style={{ height: `${(v.paper / maxVolume) * 100}%` }}
                  title={`${v.month} 紙 ${v.paper}件`}
                />
              </div>
              <span className="vbar-label">{v.month}</span>
              <span className="vbar-label text-muted">{v.paper + v.digital}件</span>
            </div>
          ))}
        </div>
        <div className="legend mt-12">
          <span>
            <span className="sw" style={{ background: 'var(--accent)' }} />
            電子（ワークフロー・電子契約）
          </span>
          <span>
            <span className="sw" style={{ background: 'var(--border-strong)' }} />
            紙・押印での処理
          </span>
        </div>
      </section>
    </div>
  );
}

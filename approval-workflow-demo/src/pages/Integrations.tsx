import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AccountingJob, Contract } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { accountingFieldMap, capabilities } from '../data/sampleData';
import { formatDateTime, formatYen, nowIso } from '../utils/format';

interface IntegrationsProps {
  contracts: Contract[];
  jobs: AccountingJob[];
  actions: AppActions;
}

const JOB_STATUS: Record<AccountingJob['status'], { label: string; tone: string }> = {
  success: { label: '連携成功', tone: 'success' },
  running: { label: '連携中', tone: 'info' },
  failed: { label: '連携失敗', tone: 'error' },
};

export function Integrations({ contracts, jobs, actions }: IntegrationsProps) {
  const navigate = useNavigate();
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const unlinked = contracts.filter(c => c.accounting === 'unlinked');
  const failed = jobs.filter(j => j.status === 'failed');
  const lastSuccess = jobs.find(j => j.status === 'success');

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">外部連携</h1>
          <p className="page-sub">
            本システムが外部システムと接続するのは会計システムのみです。契約金額・賃料・支払期間を連携し、支払データの二重入力をなくします。
          </p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi accent-success">
          <div className="kpi-label">会計システムの接続状態</div>
          <div className="kpi-value" style={{ fontSize: '20px' }}>
            接続済
          </div>
        </div>
        <div className="kpi accent-warning">
          <div className="kpi-label">未連携の契約書</div>
          <div className={`kpi-value${unlinked.length > 0 ? ' warning' : ''}`}>
            {unlinked.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-error">
          <div className="kpi-label">連携失敗</div>
          <div className={`kpi-value${failed.length > 0 ? ' error' : ''}`}>
            {failed.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-info">
          <div className="kpi-label">最終連携</div>
          <div className="kpi-value" style={{ fontSize: '15px', lineHeight: 1.5 }}>
            {lastSuccess ? formatDateTime(lastSuccess.sentAt) : '—'}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              会計システム連携の設定
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="k">連携先</div>
                <div className="v">会計システム（貴社ご利用のもの）</div>
              </div>
              <div className="info-item">
                <div className="k">連携方式</div>
                <div className="v">契約書ごとの手動送信＋毎営業日 深夜の自動送信</div>
              </div>
              <div className="info-item">
                <div className="k">連携する情報</div>
                <div className="v">契約金額・月額賃料・支払期間・相手先・契約種別</div>
              </div>
              <div className="info-item">
                <div className="k">連携しない情報</div>
                <div className="v">契約書の本文・添付ファイル・署名情報</div>
              </div>
            </div>
            <div className="divider" />
            <div className="row gap-10 wrap">
              <button className="btn btn-secondary" onClick={() => setCheckedAt(nowIso())}>
                会計システムとの疎通確認を実行する
              </button>
              {checkedAt && (
                <span className="fs-13 text-sub">
                  {formatDateTime(checkedAt)} 　接続を確認しました（応答 0.4 秒）
                </span>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              未連携の契約書
            </div>
            {unlinked.length === 0 ? (
              <EmptyState title="未連携の契約書はありません" desc="すべての契約書が会計システムへ連携済みです。" />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>契約番号</th>
                      <th>契約内容 / 相手先</th>
                      <th className="num">契約金額</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlinked.map(c => (
                      <tr key={c.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/contracts/${c.id}`)}>
                            {c.code}
                          </button>
                        </td>
                        <td>
                          <div className="fw-600">{c.title}</div>
                          <div className="fs-12 text-sub">
                            {c.counterparty}／{c.contractType}
                          </div>
                        </td>
                        <td className="num">{formatYen(c.amount)}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => actions.linkAccounting(c.id, '新規登録')}
                          >
                            会計システムへ連携する
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              連携ジョブの履歴
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>連携番号</th>
                    <th>対象の契約書</th>
                    <th>区分</th>
                    <th className="num">契約金額</th>
                    <th>送信日時</th>
                    <th>結果</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{j.code}</td>
                      <td>
                        <div className="fw-600">{j.contractTitle}</div>
                        <div className="fs-12 text-sub">
                          {j.contractCode}／{j.counterparty}
                        </div>
                        {j.status === 'failed' && j.message && <div className="fs-12 text-error mt-4">{j.message}</div>}
                      </td>
                      <td className="fs-13">{j.kind}</td>
                      <td className="num">{formatYen(j.amount)}</td>
                      <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(j.sentAt)}
                      </td>
                      <td>
                        <div className="row gap-6 wrap">
                          <Badge tone={JOB_STATUS[j.status].tone} label={JOB_STATUS[j.status].label} />
                          {j.status === 'failed' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => actions.retryAccountingJob(j.id)}>
                              再連携する
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="stack gap-12">
          <section className="card card-pad" data-tour="capability-table">
            <div className="section-title">
              <span className="bar" />
              機能ごとの実現方式
            </div>
            <p className="fs-13 text-sub mb-12">
              外部システムとつなぐのは会計システムのみです。電子契約・AI項目抽出・契約書の保管は本システム内で完結します。
            </p>
            <div className="table-wrap">
              <table className="data compact">
                <thead>
                  <tr>
                    <th>機能</th>
                    <th>区分</th>
                    <th>実現方式</th>
                  </tr>
                </thead>
                <tbody>
                  {capabilities.map(c => (
                    <tr key={c.name}>
                      <td className="fs-13">{c.name}</td>
                      <td>
                        <Badge tone={c.external ? 'info' : 'muted'} label={c.external ? '外部連携' : '内部完結'} />
                      </td>
                      <td className="fs-13">{c.how}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              会計システムへ渡す項目
            </div>
            <div className="table-wrap">
              <table className="data compact">
                <thead>
                  <tr>
                    <th>本システムの項目</th>
                    <th>会計システムの項目</th>
                    <th>補足</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingFieldMap.map(m => (
                    <tr key={m.from}>
                      <td className="fs-13">{m.from}</td>
                      <td className="fs-13">{m.to}</td>
                      <td className="fs-12 text-sub">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

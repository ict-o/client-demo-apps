import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContractType, Member, Request, RequestKind } from '../types';
import { roleMeta, routeRules } from '../data/sampleData';
import { RoutePreview } from '../components/RoutePreview';
import { Badge } from '../components/Badge';
import { currentStep } from '../utils/domain';
import { formatYen } from '../utils/format';

interface RouteSettingsProps {
  members: Member[];
  requests: Request[];
}

const CONTRACT_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約', '工事請負契約', '業務委託契約'];

const AMOUNT_PRESETS = [500_000, 1_500_000, 6_000_000];

export function RouteSettings({ members, requests }: RouteSettingsProps) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<RequestKind>('ringi');
  const [amount, setAmount] = useState<number>(1_500_000);
  const [contractType, setContractType] = useState<ContractType>('賃貸借契約');

  /** 各承認者が現在抱えている承認待ち件数 */
  const load = useMemo(() => {
    const map: Record<string, number> = {};
    requests
      .filter(r => r.status === 'pending')
      .forEach(r => {
        const step = currentStep(r);
        if (!step) return;
        map[step.approverId] = (map[step.approverId] ?? 0) + 1;
      });
    return map;
  }, [requests]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">承認ルート設定</h1>
          <p className="page-sub">
            申請内容から承認ルートを自動判定する条件を確認し、任意の条件でルートをシミュレーションできます。
          </p>
        </div>
      </div>

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              承認ルートの判定条件
            </div>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: '520px' }}>
                <thead>
                  <tr>
                    <th>条件</th>
                    <th>追加される承認段階</th>
                    <th>備考</th>
                  </tr>
                </thead>
                <tbody>
                  {routeRules.map(rule => (
                    <tr key={rule.id}>
                      <td className="fw-600">{rule.condition}</td>
                      <td>
                        {rule.steps.map(s => (
                          <div key={s}>{s}</div>
                        ))}
                      </td>
                      <td className="fs-12 text-sub">{rule.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              承認者の状況
            </div>
            <p className="fs-13 text-sub mb-12">
              承認ルートで承認者になっている担当者と、その担当者が現在抱えている承認待ちの件数です。権限（承認者・システム管理者）を持つ利用者だけが承認できます。
            </p>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: '480px' }}>
                <thead>
                  <tr>
                    <th>承認者</th>
                    <th>権限</th>
                    <th className="num">承認待ち</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .filter(m => m.active && (m.role === 'approver' || m.role === 'admin'))
                    .map(m => (
                      <tr key={m.id}>
                        <td>
                          <div className="fw-600">{m.name}</div>
                          <div className="fs-12 text-sub">
                            {m.department} {m.title}
                            {m.holdsSeal && '／実印保有'}
                          </div>
                        </td>
                        <td>
                          <Badge tone={m.role === 'admin' ? 'accent' : 'info'} label={roleMeta[m.role].label} />
                        </td>
                        <td className="num">{load[m.id] ?? 0} 件</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="fs-12 text-muted mt-16">
              承認者の追加・変更や権限の付与は「利用者・権限管理」画面で行います。
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/users')}>
                利用者・権限管理を開く
              </button>
            </p>
          </section>
        </div>

        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            承認ルートのシミュレーション
          </div>
          <p className="fs-13 text-sub mb-12">
            条件を変更すると、その申請がどの承認ルートで回るかを即時に確認できます。
          </p>

          <div className="field">
            <label className="field-label" htmlFor="sim-kind">
              申請種別
            </label>
            <select id="sim-kind" className="select" value={kind} onChange={e => setKind(e.target.value as RequestKind)}>
              <option value="ringi">稟議書</option>
              <option value="seal">捺印申請（実印）</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="sim-type">
              契約種別
            </label>
            <select
              id="sim-type"
              className="select"
              value={contractType}
              onChange={e => setContractType(e.target.value as ContractType)}
            >
              {CONTRACT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="sim-amount">
              契約金額（円）
            </label>
            <input
              id="sim-amount"
              className="input"
              inputMode="numeric"
              value={String(amount)}
              onChange={e => setAmount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
            <div className="row gap-8 wrap mt-8">
              {AMOUNT_PRESETS.map(v => (
                <button key={v} className="btn btn-secondary btn-sm" onClick={() => setAmount(v)}>
                  {formatYen(v)}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />
          <RoutePreview input={{ kind, amount, contractType }} members={members} />
        </section>
      </div>
    </div>
  );
}

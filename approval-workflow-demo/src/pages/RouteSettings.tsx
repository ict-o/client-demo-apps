import { useMemo, useState } from 'react';
import type { ContractType, Member, Request, RequestKind } from '../types';
import type { AppActions } from '../App';
import { routeRules } from '../data/sampleData';
import { RoutePreview } from '../components/RoutePreview';
import { Badge } from '../components/Badge';
import { currentStep } from '../utils/domain';
import { formatYen } from '../utils/format';

interface RouteSettingsProps {
  members: Member[];
  requests: Request[];
  actions: AppActions;
}

const CONTRACT_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約', '工事請負契約', '業務委託契約'];

const AMOUNT_PRESETS = [500_000, 1_500_000, 6_000_000];

export function RouteSettings({ members, requests, actions }: RouteSettingsProps) {
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
          <h1 className="page-title">承認ルート設定（多段階承認）</h1>
          <p className="page-sub">
            申請内容に応じた承認ルートの判定条件と、担当者不在時の代理承認設定を管理します。設定はその場で反映されます。
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
              不在・代理承認者の設定
            </div>
            <p className="fs-13 text-sub mb-12">
              不在に設定すると、その承認者が担当する段階は代理承認者が処理できるようになり、書類の滞留を防げます。
            </p>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: '560px' }}>
                <thead>
                  <tr>
                    <th>承認者</th>
                    <th className="num">承認待ち</th>
                    <th>不在設定</th>
                    <th>代理承認者</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="fw-600">{m.name}</div>
                        <div className="fs-12 text-sub">
                          {m.department} {m.title}
                          {m.holdsSeal && '／実印保有'}
                        </div>
                      </td>
                      <td className="num">{load[m.id] ?? 0} 件</td>
                      <td>
                        <div className="row gap-8 wrap">
                          <Badge tone={m.absent ? 'warning' : 'success'} label={m.absent ? '不在中' : '在席'} />
                          <button
                            className={`btn btn-sm ${m.absent ? 'btn-secondary' : 'btn-secondary'}`}
                            onClick={() => actions.setMemberAbsent(m.id, !m.absent)}
                          >
                            {m.absent ? '在席に戻す' : '不在にする'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <label className="field-label" htmlFor={`dg-${m.id}`} style={{ position: 'absolute', left: '-9999px' }}>
                          {m.name} の代理承認者
                        </label>
                        <select
                          id={`dg-${m.id}`}
                          className="select"
                          value={m.delegateId ?? ''}
                          onChange={e => actions.setMemberDelegate(m.id, e.target.value)}
                          style={{ minWidth: '160px' }}
                        >
                          {members
                            .filter(x => x.id !== m.id)
                            .map(x => (
                              <option key={x.id} value={x.id}>
                                {x.name}（{x.title}）
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

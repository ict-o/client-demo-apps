import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AccountingExport, Contract, Member } from '../types';
import type { AppActions } from '../App';
import { EmptyState } from '../components/EmptyState';
import { ACCOUNTING_CSV_COLUMNS, accountingFieldMap, capabilities } from '../data/sampleData';
import { canApproveByRole } from '../utils/domain';
import { formatDate, formatDateTime, formatYen } from '../utils/format';

interface AccountingProps {
  contracts: Contract[];
  exports: AccountingExport[];
  viewer: Member;
  actions: AppActions;
}

/** CSVの1行分を組み立てる（プレビュー表示用） */
function csvRow(c: Contract): string[] {
  return [
    c.code,
    c.counterparty,
    c.contractType,
    String(c.amount),
    String(c.rentMonthly),
    c.startDate,
    c.endDate,
  ];
}

/** 会計システム連携（CSV出力） */
export function Accounting({ contracts, exports, viewer, actions }: AccountingProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  const unlinked = useMemo(() => contracts.filter(c => c.accounting === 'unlinked'), [contracts]);
  const targets = useMemo(() => unlinked.filter(c => selected.includes(c.id)), [unlinked, selected]);
  const lastExport = exports[0];
  const canExport = canApproveByRole(viewer.role);

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected(prev => (prev.length === unlinked.length ? [] : unlinked.map(c => c.id)));
  };

  const runExport = () => {
    actions.exportAccountingCsv(targets.map(c => c.id));
    setSelected([]);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">会計システム連携</h1>
          <p className="page-sub">
            本システムが外部システムと接続するのは会計システムのみです。契約金額・賃料・支払期間をCSVで出力し、会計システムに取り込むことで支払データの二重入力をなくします。
          </p>
        </div>
      </div>

      <div className="kpi-row" data-tour="accounting-kpi">
        <div className="kpi accent-warning">
          <div className="kpi-label">未出力の契約書</div>
          <div className={`kpi-value${unlinked.length > 0 ? ' warning' : ''}`}>
            {unlinked.length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi accent-info">
          <div className="kpi-label">選択中</div>
          <div className="kpi-value">
            {targets.length}
            <span className="kpi-unit">件</span>
          </div>
          <div className="kpi-note">合計 {formatYen(targets.reduce((sum, c) => sum + c.amount, 0))}</div>
        </div>
        <div className="kpi accent-success">
          <div className="kpi-label">出力済の契約書</div>
          <div className="kpi-value">
            {contracts.filter(c => c.accounting === 'linked').length}
            <span className="kpi-unit">件</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">最終出力</div>
          <div className="kpi-value" style={{ fontSize: '15px', lineHeight: 1.5 }}>
            {lastExport ? formatDateTime(lastExport.exportedAt) : '—'}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad" data-tour="accounting-targets">
            <div className="section-title">
              <span className="bar" />
              CSVに出力する契約書を選ぶ
            </div>
            {unlinked.length === 0 ? (
              <EmptyState title="未出力の契約書はありません" desc="登録済の契約書はすべて会計システムへ出力しています。" />
            ) : (
              <>
                <div className="row gap-10 wrap mb-12">
                  <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                    {selected.length === unlinked.length ? 'すべての選択を解除' : 'すべて選択'}
                  </button>
                  <span className="fs-13 text-sub">{unlinked.length} 件が未出力です</span>
                </div>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th style={{ width: '44px' }}>選択</th>
                        <th>契約番号 / 契約内容</th>
                        <th className="num">契約金額</th>
                        <th className="num">月額賃料</th>
                        <th>契約期間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unlinked.map(c => (
                        <tr key={c.id}>
                          <td>
                            <label className="table-check">
                              <input
                                type="checkbox"
                                checked={selected.includes(c.id)}
                                onChange={() => toggle(c.id)}
                                aria-label={`${c.title} をCSV出力の対象にする`}
                              />
                            </label>
                          </td>
                          <td>
                            <div className="fw-600">{c.title}</div>
                            <div className="fs-12 text-sub">
                              {c.code}／{c.counterparty}／{c.contractType}
                            </div>
                          </td>
                          <td className="num">{formatYen(c.amount)}</td>
                          <td className="num">{c.rentMonthly > 0 ? formatYen(c.rentMonthly) : '—'}</td>
                          <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>
                            {formatDate(c.startDate)}
                            <div className="fs-12 text-sub">〜 {formatDate(c.endDate)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              出力内容のプレビュー
            </div>
            {targets.length === 0 ? (
              <EmptyState title="出力対象が選択されていません" desc="上の一覧から会計システムへ渡す契約書を選択してください。" />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data" style={{ minWidth: '640px' }}>
                    <thead>
                      <tr>
                        {ACCOUNTING_CSV_COLUMNS.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map(c => (
                        <tr key={c.id}>
                          {csvRow(c).map((v, i) => (
                            <td key={i} className={i === 3 || i === 4 ? 'num' : 'fs-13'}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row gap-10 wrap mt-16">
                  <button className="btn btn-primary btn-lg" onClick={runExport} disabled={!canExport} title={canExport ? undefined : 'CSV出力は承認者・システム管理者の権限で行えます'}>
                    選択した {targets.length} 件をCSV出力する
                  </button>
                  <button className="btn btn-secondary btn-lg" onClick={() => setSelected([])}>
                    選択を解除する
                  </button>
                </div>
                {!canExport && (
                  <p className="fs-12 text-sub mt-8">
                    ログイン中の利用者にはCSV出力の権限がありません。画面右上の利用者切替で承認者またはシステム管理者に切り替えてください。
                  </p>
                )}
              </>
            )}
          </section>

          <section className="card card-pad" data-tour="accounting-history">
            <div className="section-title">
              <span className="bar" />
              CSV出力の履歴
            </div>
            {exports.length === 0 ? (
              <EmptyState title="出力履歴はありません" desc="CSVを出力すると、ここに履歴が残ります。" />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>出力番号</th>
                      <th>ファイル名</th>
                      <th className="num">件数</th>
                      <th className="num">契約金額合計</th>
                      <th>区分</th>
                      <th>出力日時 / 担当者</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map(x => (
                      <tr key={x.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{x.code}</td>
                        <td className="fs-13">{x.fileName}</td>
                        <td className="num">{x.contractCodes.length} 件</td>
                        <td className="num">{formatYen(x.totalAmount)}</td>
                        <td className="fs-13">{x.kind}</td>
                        <td className="fs-13" style={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(x.exportedAt)}
                          <div className="fs-12 text-sub">{x.exportedBy}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              連携の仕様
            </div>
            <div className="info-item">
              <div className="k">連携先</div>
              <div className="v">会計システム（貴社ご利用のもの）</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">連携方式</div>
              <div className="v">CSVファイルの出力と取込（APIによる自動連携は次フェーズの対象）</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">連携する情報</div>
              <div className="v">契約金額・月額賃料・支払期間・相手先・契約種別</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">連携しない情報</div>
              <div className="v">契約書の本文・添付ファイル・署名情報</div>
            </div>
            <div className="divider" />
            <div className="section-title">CSVの列と会計システムの項目</div>
            <div className="table-wrap mt-16">
              <table className="data">
                <thead>
                  <tr>
                    <th>本システム</th>
                    <th>会計システム</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingFieldMap.map(f => (
                    <tr key={f.from}>
                      <td className="fs-13 fw-600">{f.from}</td>
                      <td className="fs-13">
                        {f.to}
                        <div className="fs-12 text-sub">{f.note}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              機能ごとの実現方式
            </div>
            <p className="fs-13 text-sub mb-12">
              外部システムと接続するのは会計システムのみです。それ以外の機能は本システム内で完結します。
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>機能</th>
                    <th>区分</th>
                  </tr>
                </thead>
                <tbody>
                  {capabilities.map(c => (
                    <tr key={c.name}>
                      <td className="fs-13">
                        {c.name}
                        <div className="fs-12 text-sub">{c.how}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={c.external ? 'tag tag-external' : 'tag'}>{c.external ? '外部連携' : '内部完結'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divider" />
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/contracts')}>
              契約書管理へ移動する
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

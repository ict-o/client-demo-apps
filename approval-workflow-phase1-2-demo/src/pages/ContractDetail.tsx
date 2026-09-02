import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Contract, Envelope, Member, Request } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { canApproveByRole, contractPhase, contractPhaseMeta } from '../utils/domain';
import { accountingFieldMap } from '../data/sampleData';
import { formatDate, formatDateTime, formatYen } from '../utils/format';

interface ContractDetailProps {
  viewer: Member;
  contracts: Contract[];
  requests: Request[];
  envelopes: Envelope[];
  actions: AppActions;
}

export function ContractDetail({ viewer, contracts, requests, envelopes, actions }: ContractDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const contract = contracts.find(c => c.id === id);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  if (!contract) {
    return (
      <div className="card">
        <EmptyState title="契約書が見つかりません" desc="契約書管理の一覧から選び直してください。" />
        <div className="row" style={{ justifyContent: 'center', paddingBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/contracts')}>
            契約書管理へ戻る
          </button>
        </div>
      </div>
    );
  }

  const meta = contractPhaseMeta(contractPhase(contract));
  const source = requests.find(r => r.code === contract.sourceRequestCode);
  const envelope = envelopes.find(e => e.code === contract.envelopeCode);

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate('/contracts')}>
        ← 契約書管理へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="tag">{contract.code}</span>
            <Badge tone={meta.tone} label={meta.label} />
            <span className="tag">{contract.origin === 'esign' ? '電子契約' : 'スキャン原本'}</span>
          </div>
          <h1 className="page-title">{contract.title}</h1>
          <p className="page-sub">
            {contract.counterparty}／{contract.contractType}／保管先: {contract.folder}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
          契約書プレビューを表示
        </button>
      </div>

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約の主要項目
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="k">契約相手先企業名</div>
                <div className="v">{contract.counterparty}</div>
              </div>
              <div className="info-item">
                <div className="k">契約種別</div>
                <div className="v">{contract.contractType}</div>
              </div>
              <div className="info-item">
                <div className="k">物件情報</div>
                <div className="v">{contract.property !== '' ? contract.property : '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">月額賃料</div>
                <div className="v">{contract.rentMonthly > 0 ? formatYen(contract.rentMonthly) : '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">契約金額</div>
                <div className="v">{formatYen(contract.amount)}</div>
              </div>
              <div className="info-item">
                <div className="k">契約開始日</div>
                <div className="v">{formatDate(contract.startDate)}</div>
              </div>
              <div className="info-item">
                <div className="k">契約満了日</div>
                <div className="v">{formatDate(contract.endDate)}</div>
              </div>
              <div className="info-item">
                <div className="k">自動更新</div>
                <div className="v">{contract.autoRenew ? 'あり' : 'なし'}</div>
              </div>
              <div className="info-item">
                <div className="k">登録日</div>
                <div className="v">{formatDate(contract.registeredAt)}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="row gap-8 wrap">
              <span className="fs-12 text-sub">自動付与タグ:</span>
              {contract.tags.map(t => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="card card-pad" data-tour="accounting-panel">
            <div className="section-title">
              <span className="bar" />
              会計システム連携（外部連携）
            </div>
            <p className="fs-13 text-sub mb-12">
              契約金額・賃料・支払期間をCSVで出力し、会計システムに取り込むことで支払データの二重入力をなくします。
              本システムが外部システムと接続するのは、この会計システム連携だけです。
            </p>
            <div className="row gap-12 wrap mb-12">
              <Badge
                tone={contract.accounting === 'linked' ? 'success' : 'muted'}
                label={contract.accounting === 'linked' ? 'CSV出力済' : '未出力'}
              />
              {contract.accounting === 'linked' && contract.accountingJobCode && (
                <span className="fs-12 text-sub">
                  出力番号 {contract.accountingJobCode}
                  {contract.accountingLinkedAt && `／${formatDateTime(contract.accountingLinkedAt)}`}
                </span>
              )}
            </div>
            <div className="row gap-10 wrap">
              <button className="btn btn-secondary btn-sm" onClick={() => setLinkOpen(true)}>
                出力する項目を確認する
              </button>
              {contract.accounting === 'unlinked' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    actions.exportAccountingCsv([contract.id]);
                  }}
                  disabled={!canApproveByRole(viewer.role)}
                  title={canApproveByRole(viewer.role) ? undefined : 'CSV出力は承認者・システム管理者の権限で行えます'}
                >
                  この契約をCSV出力する
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/accounting')}>
                会計システム連携の画面を開く
              </button>
            </div>
          </section>
        </div>

        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              締結方法
            </div>
            {envelope ? (
              <>
                <div className="row gap-8 wrap mb-8">
                  <span className="tag">電子契約</span>
                  <span className="tag">{envelope.code}</span>
                </div>
                <p className="fs-13 text-sub mb-12">
                  {envelope.completedAt && `${formatDateTime(envelope.completedAt)} に`}
                  {envelope.signers.map(sg => sg.name).join(' さん・')} さんの電子署名により締結しました。
                  合意締結証明書と操作履歴を確認できます。
                </p>
                <button className="btn btn-secondary btn-block" onClick={() => navigate(`/esign/${envelope.id}`)}>
                  電子契約の締結情報を開く
                </button>
              </>
            ) : (
              <p className="fs-13 text-sub">
                {contract.origin === 'esign'
                  ? 'この契約書は電子契約で締結されました。'
                  : '捺印済の原本をスキャンして登録した契約書です。原本は書庫で保管します。'}
              </p>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              関連する申請
            </div>
            {source ? (
              <button className="mini-case" onClick={() => navigate(`/requests/${source.id}`)}>
                <span className="row gap-8 wrap">
                  <span className="tag">{source.code}</span>
                  <span className="tag">{source.kind === 'seal' ? '捺印申請' : '稟議書'}</span>
                </span>
                <span className="fs-13 fw-600">{source.title}</span>
                <span className="fs-12 text-sub">承認履歴と締結方法を確認できます</span>
              </button>
            ) : (
              <p className="fs-13 text-sub">
                この契約書はワークフローを経由せず、紙契約書のPDF登録から登録されました。関連する申請はありません。
              </p>
            )}
          </section>

        </div>
      </div>

      <Modal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="会計システムへ連携する内容"
        width={620}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setLinkOpen(false)}>
              閉じる
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                actions.exportAccountingCsv([contract.id]);
                setLinkOpen(false);
              }}
              disabled={contract.accounting === 'linked' || !canApproveByRole(viewer.role)}
              title={
                contract.accounting === 'linked'
                  ? 'この契約書はCSV出力済です'
                  : canApproveByRole(viewer.role)
                    ? undefined
                    : 'CSV出力は承認者・システム管理者の権限で行えます'
              }
            >
              この内容でCSV出力する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">
          次の項目をCSVに出力します。契約書の本文・添付ファイル・署名情報は出力しません。
        </p>
        <div className="table-wrap">
          <table className="data compact">
            <thead>
              <tr>
                <th>会計システムの項目</th>
                <th>送信する値</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fs-13">取引番号</td>
                <td className="fs-13">{contract.code}</td>
              </tr>
              <tr>
                <td className="fs-13">支払先マスタ</td>
                <td className="fs-13">{contract.counterparty}</td>
              </tr>
              <tr>
                <td className="fs-13">契約金額（税抜）</td>
                <td className="fs-13 num">{formatYen(contract.amount)}</td>
              </tr>
              <tr>
                <td className="fs-13">毎月の支払予定額</td>
                <td className="fs-13 num">{contract.rentMonthly > 0 ? formatYen(contract.rentMonthly) : '—'}</td>
              </tr>
              <tr>
                <td className="fs-13">支払期間</td>
                <td className="fs-13">
                  {formatDate(contract.startDate)} 〜 {formatDate(contract.endDate)}
                </td>
              </tr>
              <tr>
                <td className="fs-13">勘定科目</td>
                <td className="fs-13">{contract.contractType === '賃貸借契約' ? '地代家賃' : '支払手数料'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="divider" />
        <div className="fs-12 text-sub">
          項目の対応: {accountingFieldMap.map(m => `${m.from}→${m.to}`).join('／')}
        </div>
      </Modal>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="契約書プレビュー" width={620}>
        <div className="doc-preview">
          <h3>{contract.contractType}書</h3>
          <dl>
            <dt>契約番号</dt>
            <dd>{contract.code}</dd>
            <dt>契約相手先</dt>
            <dd>{contract.counterparty}　御中</dd>
            <dt>契約当事者</dt>
            <dd>株式会社〇〇エステートパートナーズ</dd>
            <dt>対象物件</dt>
            <dd>{contract.property !== '' ? contract.property : '—'}</dd>
            <dt>契約金額</dt>
            <dd>{formatYen(contract.amount)}</dd>
            <dt>月額賃料</dt>
            <dd>{contract.rentMonthly > 0 ? formatYen(contract.rentMonthly) : '—'}</dd>
            <dt>契約期間</dt>
            <dd>
              {formatDate(contract.startDate)} 〜 {formatDate(contract.endDate)}
            </dd>
          </dl>
          <div className="seal-mark">
            <span className="seal-circle">
              {contract.origin === 'esign' ? (
                <>
                  電子
                  <br />署名
                </>
              ) : (
                <>
                  締結
                  <br />済
                </>
              )}
            </span>
          </div>
        </div>
        <p className="fs-12 text-sub mt-12">これはデモ用の簡易プレビューです。実際の契約書レイアウトは導入時に定義します。</p>
      </Modal>
    </div>
  );
}

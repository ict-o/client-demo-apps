import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Contract, Envelope, Request } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { contractPhase, contractPhaseMeta } from '../utils/domain';
import { accountingFieldMap } from '../data/sampleData';
import { daysUntil, formatDate, formatDateTime, formatYen } from '../utils/format';

interface ContractDetailProps {
  contracts: Contract[];
  requests: Request[];
  envelopes: Envelope[];
  actions: AppActions;
}

export function ContractDetail({ contracts, requests, envelopes, actions }: ContractDetailProps) {
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
  const rest = daysUntil(contract.endDate);
  const source = requests.find(r => r.code === contract.sourceRequestCode);
  const envelope = envelopes.find(e => e.code === contract.envelopeCode);

  const renewRequest = () => {
    const nextStart = contract.endDate;
    navigate('/requests/new', {
      state: {
        kind: 'ringi',
        title: `${contract.title}の更新`,
        purpose: `${contract.counterparty} との${contract.contractType}が ${formatDate(contract.endDate)} に満了するため、契約を更新したい。`,
        amount: String(contract.amount),
        contractType: contract.contractType,
        counterparty: contract.counterparty,
        counterpartyEsign: contract.origin === 'esign' ? 'yes' : 'no',
        property: contract.property,
        rentMonthly: contract.rentMonthly > 0 ? String(contract.rentMonthly) : '',
        startDate: nextStart,
        endDate: '',
      },
    });
  };

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
            {contract.aiExtracted && <Badge tone="accent" label="AI項目抽出で登録" />}
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

      {rest <= 60 && (
        <div className={`banner ${rest < 0 ? 'error' : 'warning'}`}>
          <span aria-hidden="true">!</span>
          <div>
            {rest < 0 ? (
              <>
                <strong>契約期限を {-rest} 日超過しています。</strong>更新または終了の手続きを行ってください。
              </>
            ) : (
              <>
                <strong>契約満了まであと {rest} 日です。</strong>
                {contract.autoRenew ? '自動更新条項があります。更新しない場合は通知期限に注意してください。' : '更新する場合は更新稟議を起票してください。'}
              </>
            )}
          </div>
        </div>
      )}

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
                <div className="v">
                  {formatDate(contract.endDate)}
                  {rest >= 0 ? `（あと${rest}日）` : `（${-rest}日超過）`}
                </div>
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
              契約金額・賃料・支払期間を会計システムへ連携し、支払データの二重入力をなくします。
              本システムが外部システムと接続するのは、この会計システム連携だけです。
            </p>
            <div className="row gap-12 wrap mb-12">
              <Badge
                tone={contract.accounting === 'linked' ? 'success' : 'muted'}
                label={contract.accounting === 'linked' ? '連携済' : '未連携'}
              />
              {contract.accounting === 'linked' && contract.accountingJobCode && (
                <span className="fs-12 text-sub">
                  連携番号 {contract.accountingJobCode}
                  {contract.accountingLinkedAt && `／${formatDateTime(contract.accountingLinkedAt)}`}
                </span>
              )}
            </div>
            <div className="row gap-10 wrap">
              <button className="btn btn-secondary btn-sm" onClick={() => setLinkOpen(true)}>
                連携内容を確認する
              </button>
              {contract.accounting === 'linked' ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => actions.linkAccounting(contract.id, '更新')}
                >
                  内容を再連携する
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => actions.linkAccounting(contract.id, '新規登録')}
                >
                  会計システムへ連携する
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/integrations')}>
                連携履歴を開く
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
                  合意締結証明書と監査ログを確認できます。
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
                この契約書はワークフローを経由せず、取込（AI項目抽出）から登録されました。関連する申請はありません。
              </p>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              更新手続き
            </div>
            <p className="fs-13 text-sub mb-12">
              契約内容を引き継いだ状態で更新稟議を起票します。承認ルートは更新後の金額に応じて自動判定されます。
            </p>
            <button className="btn btn-primary btn-block" onClick={renewRequest}>
              この契約の更新稟議を起票する
            </button>
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
                actions.linkAccounting(contract.id, contract.accounting === 'linked' ? '更新' : '新規登録');
                setLinkOpen(false);
              }}
            >
              この内容で連携する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">
          次の項目を会計システムへ送信します。契約書の本文・添付ファイル・署名情報は送信しません。
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

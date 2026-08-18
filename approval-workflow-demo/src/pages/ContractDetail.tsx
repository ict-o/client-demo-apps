import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Contract, Request } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { contractPhase, contractPhaseMeta } from '../utils/domain';
import { daysUntil, formatDate, formatYen } from '../utils/format';

interface ContractDetailProps {
  contracts: Contract[];
  requests: Request[];
  actions: AppActions;
}

export function ContractDetail({ contracts, requests, actions }: ContractDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const contract = contracts.find(c => c.id === id);
  const [previewOpen, setPreviewOpen] = useState(false);

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

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              会計システム連携
            </div>
            <p className="fs-13 text-sub mb-12">
              契約金額・賃料・支払期間を会計システムへ連携し、支払データの二重入力をなくします。
            </p>
            <div className="row gap-12 wrap">
              <Badge
                tone={contract.accounting === 'linked' ? 'success' : 'muted'}
                label={contract.accounting === 'linked' ? '連携済' : '未連携'}
              />
              {contract.accounting === 'linked' ? (
                <button className="btn btn-secondary btn-sm" disabled title="この契約はすでに会計システムへ連携済みです">
                  会計システムへ連携する
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => actions.linkAccounting(contract.id)}>
                  会計システムへ連携する
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="stack gap-12">
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

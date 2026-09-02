import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Envelope, Member, Request } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ApprovalSteps } from '../components/ApprovalSteps';
import { EmptyState } from '../components/EmptyState';
import { canAct, currentStep, requestStatusMeta, stagnantDays } from '../utils/domain';
import { deadlineDays, envelopeStatusMeta, nextSigner, signProgress } from '../utils/esign';
import { formatDate, formatDateTime, formatYen } from '../utils/format';

interface RequestDetailProps {
  requests: Request[];
  members: Member[];
  viewer: Member;
  envelopes: Envelope[];
  actions: AppActions;
}

export function RequestDetail({ requests, members, viewer, envelopes, actions }: RequestDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const req = requests.find(r => r.id === id);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [sealOpen, setSealOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [sealStage, setSealStage] = useState<'request' | 'scan'>('request');

  if (!req) {
    return (
      <div className="card">
        <EmptyState title="申請が見つかりません" desc="一覧から申請を選び直してください。" />
        <div className="row" style={{ justifyContent: 'center', paddingBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/requests')}>
            申請一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  const meta = requestStatusMeta(req.status);
  const step = currentStep(req);
  const act = canAct(req, viewer, members);
  const applicant = members.find(m => m.id === req.applicantId);
  const sealHolder = members.find(m => m.holdsSeal);
  const days = stagnantDays(req);
  const envelope = envelopes.find(e => e.id === req.envelopeId);

  const doApprove = () => {
    actions.approve(req.id, comment);
    setComment('');
    setApproveOpen(false);
  };

  const doReject = () => {
    if (rejectReason.trim() === '') {
      setRejectError('差戻し理由を入力してください');
      return;
    }
    actions.reject(req.id, rejectReason);
    setRejectReason('');
    setRejectError('');
    setRejectOpen(false);
  };

  const concludeOnPaper = () => {
    const contractId = actions.concludeOnPaper(req.id);
    setSealOpen(false);
    setSealStage('request');
    if (contractId) navigate(`/contracts/${contractId}`);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate('/requests')}>
        ← 申請一覧へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="tag">{req.code}</span>
            <span className="tag">{req.kind === 'seal' ? '捺印申請' : '稟議書'}</span>
            <Badge tone={meta.tone} label={meta.label} />
            {req.status === 'pending' && days >= 3 && <Badge tone="error" label={`${days}日滞留`} />}
          </div>
          <h1 className="page-title">{req.title}</h1>
          <p className="page-sub">
            申請者: {applicant?.name}（{req.department}）／申請日時: {formatDateTime(req.appliedAt)}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
          契約書プレビューを表示
        </button>
      </div>

      {req.status === 'rejected' && (
        <div className="banner error">
          <span aria-hidden="true">!</span>
          <div>
            <strong>この申請は差し戻されています。</strong>
            {req.steps.find(s => s.status === 'rejected')?.comment}
          </div>
        </div>
      )}

      {req.status === 'completed' && (
        <div className="banner info">
          <span aria-hidden="true">✔</span>
          <div>
            <strong>締結が完了しています。</strong>
            {req.sealMethod === 'esign' ? '電子契約で締結し' : '捺印済の原本をスキャン取込し'}、契約書管理に登録済みです。
          </div>
        </div>
      )}

      {req.status === 'signing' && envelope && (
        <div className="banner warning">
          <span aria-hidden="true">✎</span>
          <div>
            <strong>電子契約で署名手続き中です（{envelope.code}）。</strong>
            {nextSigner(envelope)
              ? `${nextSigner(envelope)?.name} さんの署名待ちです。`
              : '署名状況を確認してください。'}
            <button className="btn btn-ghost btn-sm mt-8" onClick={() => navigate(`/esign/${envelope.id}`)}>
              署名状況を確認する
            </button>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              申請内容
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="k">契約相手先</div>
                <div className="v">{req.counterparty}</div>
              </div>
              <div className="info-item">
                <div className="k">契約種別</div>
                <div className="v">{req.contractType}</div>
              </div>
              <div className="info-item">
                <div className="k">物件情報</div>
                <div className="v">{req.property && req.property !== '' ? req.property : '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">契約金額</div>
                <div className="v">{formatYen(req.amount)}</div>
              </div>
              <div className="info-item">
                <div className="k">月額賃料</div>
                <div className="v">{req.rentMonthly && req.rentMonthly > 0 ? formatYen(req.rentMonthly) : '—'}</div>
              </div>
              <div className="info-item">
                <div className="k">契約期間</div>
                <div className="v">
                  {req.startDate ? formatDate(req.startDate) : '—'} 〜 {req.endDate ? formatDate(req.endDate) : '—'}
                </div>
              </div>
              <div className="info-item">
                <div className="k">相手先の電子契約対応</div>
                <div className="v">{req.counterpartyEsign ? '対応している' : '対応していない（紙で締結）'}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="info-item">
              <div className="k">申請理由・目的</div>
              <div className="v">{req.purpose}</div>
            </div>
          </section>

          <section className="card card-pad" data-tour="approval-steps">
            <div className="section-title">
              <span className="bar" />
              承認ルート（{req.steps.length}段階）
            </div>
            <ApprovalSteps steps={req.steps} members={members} />

            {req.status === 'pending' && (
              <div className="mt-16">
                <div className="divider" />
                {act.ok ? (
                  <>
                    <div className="row gap-10 wrap">
                      <button className="btn btn-primary btn-lg" onClick={() => setApproveOpen(true)}>
                        承認する
                      </button>
                      <button className="btn btn-danger-outline btn-lg" onClick={() => setRejectOpen(true)}>
                        差し戻す
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row gap-10 wrap">
                      <button className="btn btn-primary btn-lg" disabled title={act.reason}>
                        承認する
                      </button>
                      <button className="btn btn-danger-outline btn-lg" disabled title={act.reason}>
                        差し戻す
                      </button>
                    </div>
                    <p className="fs-12 text-sub mt-8">{act.reason}</p>
                  </>
                )}
              </div>
            )}

            {req.status === 'approved' && (
              <div className="mt-16" data-tour="conclude">
                <div className="divider" />
                <div className="section-title">
                  <span className="bar" />
                  締結方法の選択
                </div>
                <p className="fs-13 text-sub mb-12">
                  すべての承認段階が完了しました。相手先の電子契約対応状況に応じて締結方法を選択してください。
                </p>
                <div className="row gap-10 wrap">
                  {req.counterpartyEsign ? (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => navigate(`/esign/new?requestId=${req.id}`)}
                    >
                      電子契約で締結する
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-lg"
                      disabled
                      title="相手先が電子契約に対応していないため選択できません。紙での締結（捺印手配）に進んでください"
                    >
                      電子契約で締結する
                    </button>
                  )}
                  <button className="btn btn-secondary btn-lg" onClick={() => setSealOpen(true)}>
                    紙で締結する（捺印手配）
                  </button>
                </div>
                <p className="fs-12 text-sub mt-8">
                  {req.counterpartyEsign
                    ? '「電子契約で締結する」を選ぶと、署名者・署名期限・署名欄を設定する送信準備画面へ進みます。'
                    : '相手先が電子契約に未対応のため、電子契約は選択できません。捺印手配から原本のスキャン取込まで進めてください。'}
                </p>
              </div>
            )}

            {req.status === 'signing' && envelope && (
              <div className="mt-16" data-tour="conclude">
                <div className="divider" />
                <div className="section-title">
                  <span className="bar" />
                  電子契約の署名状況
                </div>
                <div className="row gap-8 wrap mb-8">
                  <span className="tag">{envelope.code}</span>
                  <Badge tone={envelopeStatusMeta(envelope.status).tone} label={envelopeStatusMeta(envelope.status).label} />
                </div>
                <div className="progress mb-8">
                  <span style={{ width: `${signProgress(envelope).percent}%` }} />
                </div>
                <p className="fs-13 text-sub mb-12">
                  {signProgress(envelope).signed} / {signProgress(envelope).total} 名が署名済です。
                  {nextSigner(envelope)
                    ? `次は ${nextSigner(envelope)?.name} さん（${
                        nextSigner(envelope)?.side === 'internal' ? '当社' : nextSigner(envelope)?.company
                      }）の署名待ちで、署名期限まであと ${deadlineDays(envelope)} 日です。`
                    : ''}
                </p>
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/esign/${envelope.id}`)}>
                  電子契約の詳細を開く
                </button>
              </div>
            )}

            {req.status === 'completed' && req.contractId && (
              <div className="mt-16">
                <div className="divider" />
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/contracts/${req.contractId}`)}>
                  登録された契約書を開く
                </button>
              </div>
            )}

            {req.status === 'rejected' && (
              <div className="mt-16">
                <div className="divider" />
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() =>
                    navigate('/requests/new', {
                      state: {
                        kind: req.kind,
                        title: req.title,
                        purpose: req.purpose,
                        amount: String(req.amount),
                        contractType: req.contractType,
                        counterparty: req.counterparty,
                        counterpartyEsign: req.counterpartyEsign ? 'yes' : 'no',
                        property: req.property ?? '',
                        rentMonthly: String(req.rentMonthly ?? ''),
                        startDate: req.startDate ?? '',
                        endDate: req.endDate ?? '',
                      },
                    })
                  }
                >
                  内容を修正して再申請する
                </button>
                <p className="fs-12 text-sub mt-8">元の申請内容が入力された状態で新規申請画面を開きます。</p>
              </div>
            )}
          </section>
        </div>

        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            処理履歴
          </div>
          <div className="timeline">
            {[...req.events].reverse().map(ev => (
              <div className="tl-item" key={ev.id}>
                <span className="tl-dot" />
                <div className="tl-time">{formatDateTime(ev.at)}</div>
                <div className="tl-text">
                  <span className="tl-actor">{ev.actor}</span>　{ev.text}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="承認する"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setApproveOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={doApprove}>
              承認を確定する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">
          「{step?.name}」を承認します。次の承認者へ自動で回覧され、最終段階の場合は締結手続きに進みます。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="approve-comment">
            コメント（任意）
          </label>
          <textarea
            id="approve-comment"
            className="textarea"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="申請を差し戻す"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRejectOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-danger-outline" onClick={doReject}>
              差戻しを確定する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">差し戻すと申請者に通知され、修正のうえ再申請できます。</p>
        <div className="field">
          <label className="field-label" htmlFor="reject-reason">
            差戻し理由<span className="req">必須</span>
          </label>
          <textarea
            id="reject-reason"
            className={`textarea${rejectError ? ' invalid' : ''}`}
            value={rejectReason}
            onChange={e => {
              setRejectReason(e.target.value);
              if (rejectError) setRejectError('');
            }}
          />
          {rejectError && <span className="field-error">{rejectError}</span>}
        </div>
      </Modal>

      <Modal
        isOpen={sealOpen}
        onClose={() => {
          setSealOpen(false);
          setSealStage('request');
        }}
        title="紙で締結する（捺印手配）"
        width={560}
        footer={
          sealStage === 'request' ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSealOpen(false);
                  setSealStage('request');
                }}
              >
                キャンセル
              </button>
              <button className="btn btn-primary" onClick={() => setSealStage('scan')}>
                捺印を依頼する
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setSealStage('request')}>
                前に戻る
              </button>
              <button className="btn btn-primary" onClick={concludeOnPaper}>
                スキャン取込して契約書を登録する
              </button>
            </>
          )
        }
      >
        {sealStage === 'request' ? (
          <>
            <p className="fs-13 mb-12">
              実印は {sealHolder?.name}（{sealHolder?.title}）のみが保有しています。捺印依頼を送ると、捺印待ちの状態として記録されます。
            </p>
            <div className="info-grid">
              <div className="info-item">
                <div className="k">捺印者</div>
                <div className="v">
                  {sealHolder?.name}（{sealHolder?.title}）
                </div>
              </div>
              <div className="info-item">
                <div className="k">印章</div>
                <div className="v">実印</div>
              </div>
              <div className="info-item">
                <div className="k">対象契約書</div>
                <div className="v">{req.contractType}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="banner info">
              <span aria-hidden="true">✔</span>
              <div>
                <strong>捺印が完了しました。</strong>
                捺印済の原本をスキャンして取り込み、契約の主要項目とあわせて契約台帳へ登録します。
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="k">読み取る主要項目</div>
                <div className="v">相手先企業名・契約種別・物件情報・賃料・契約期間</div>
              </div>
              <div className="info-item">
                <div className="k">自動振り分け先</div>
                <div className="v">
                  {req.contractType}／{req.counterparty}
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="契約書プレビュー" width={620}>
        <div className="doc-preview">
          <h3>{req.contractType}書</h3>
          <dl>
            <dt>契約相手先</dt>
            <dd>{req.counterparty}　御中</dd>
            <dt>契約当事者</dt>
            <dd>株式会社〇〇エステートパートナーズ</dd>
            <dt>対象物件</dt>
            <dd>{req.property && req.property !== '' ? req.property : '—'}</dd>
            <dt>契約金額</dt>
            <dd>{formatYen(req.amount)}</dd>
            <dt>月額賃料</dt>
            <dd>{req.rentMonthly && req.rentMonthly > 0 ? formatYen(req.rentMonthly) : '—'}</dd>
            <dt>契約期間</dt>
            <dd>
              {req.startDate ? formatDate(req.startDate) : '—'} 〜 {req.endDate ? formatDate(req.endDate) : '—'}
            </dd>
          </dl>
          <div className="seal-mark">
            <span className="seal-circle">
              {req.status === 'completed' ? (
                <>
                  締結
                  <br />済
                </>
              ) : (
                <>
                  捺印
                  <br />欄
                </>
              )}
            </span>
          </div>
        </div>
        <p className="fs-12 text-sub mt-12">
          これはデモ用の簡易プレビューです。実際の契約書レイアウトは導入時に定義します。
        </p>
      </Modal>
    </div>
  );
}

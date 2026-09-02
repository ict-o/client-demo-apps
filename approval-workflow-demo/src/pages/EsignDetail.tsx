import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Envelope, Member } from '../types';
import type { AppActions } from '../App';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { ContractDoc, SignatureSummary } from '../components/ContractDoc';
import {
  SIGNATURE_FONTS,
  addDays,
  deadlineDays,
  envelopeStatusMeta,
  isInProgress,
  nextSigner,
  signProgress,
  signerStatusMeta,
} from '../utils/esign';
import type { SignatureFontId } from '../utils/esign';
import { formatDate, formatDateTime, formatYen, todayIso } from '../utils/format';

interface EsignDetailProps {
  envelopes: Envelope[];
  viewer: Member;
  company: string;
  actions: AppActions;
}

export function EsignDetail({ envelopes, viewer, company, actions }: EsignDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const env = envelopes.find(e => e.id === id);

  const [signOpen, setSignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [fontId, setFontId] = useState<SignatureFontId>('brush');
  const [agreed, setAgreed] = useState(false);
  const [signError, setSignError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [newDeadline, setNewDeadline] = useState(addDays(todayIso(), 7));

  if (!env) {
    return (
      <div className="card">
        <EmptyState title="電子契約が見つかりません" desc="電子契約の一覧から選び直してください。" />
        <div className="row" style={{ justifyContent: 'center', paddingBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/esign')}>
            電子契約一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  const meta = envelopeStatusMeta(env.status);
  const prog = signProgress(env);
  const next = nextSigner(env);
  const rest = deadlineDays(env);
  const ourTurn = next?.side === 'internal';

  const openSignDialog = () => {
    setSignatureName(next?.name ?? viewer.name);
    setAgreed(false);
    setSignError('');
    setSignOpen(true);
  };

  const doSign = () => {
    if (!next) return;
    if (signatureName.trim() === '') {
      setSignError('署名に表示する氏名を入力してください');
      return;
    }
    if (!agreed) {
      setSignError('契約内容を確認したことにチェックしてください');
      return;
    }
    const contractId = actions.signEnvelope(env.id, next.id, signatureName.trim());
    setSignOpen(false);
    if (contractId) navigate(`/contracts/${contractId}`);
  };

  const doCancel = () => {
    if (cancelReason.trim() === '') {
      setCancelError('取消の理由を入力してください');
      return;
    }
    actions.cancelEnvelope(env.id, cancelReason.trim());
    setCancelReason('');
    setCancelError('');
    setCancelOpen(false);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate('/esign')}>
        ← 電子契約一覧へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="tag">{env.code}</span>
            <Badge tone={meta.tone} label={meta.label} />
            {env.requestCode && <span className="tag">申請 {env.requestCode}</span>}
            {env.reminderCount > 0 && <span className="tag">リマインド{env.reminderCount}回</span>}
          </div>
          <h1 className="page-title">{env.title}</h1>
          <p className="page-sub">
            {env.counterparty}／{env.contractType}／契約金額 {formatYen(env.amount)}／送信 {formatDateTime(env.sentAt)}
          </p>
        </div>
        {env.status === 'completed' && (
          <button className="btn btn-secondary" onClick={() => setCertOpen(true)}>
            合意締結証明書を表示
          </button>
        )}
      </div>

      {isInProgress(env) && rest >= 0 && rest <= 3 && (
        <div className="banner warning">
          <span aria-hidden="true">!</span>
          <div>
            <strong>署名期限まであと {rest} 日です。</strong>
            {next?.name} さんの署名が未完了です。リマインドを送信できます。
          </div>
        </div>
      )}

      {(env.status === 'expired' || (isInProgress(env) && rest < 0)) && (
        <div className="banner error">
          <span aria-hidden="true">!</span>
          <div>
            <strong>署名期限を {Math.abs(rest)} 日超過しています。</strong>
            期限を延長して再送するか、送信を取り消して内容を見直してください。
          </div>
        </div>
      )}

      {env.status === 'declined' && (
        <div className="banner error">
          <span aria-hidden="true">!</span>
          <div>
            <strong>相手先が署名を拒否しました。</strong>
            {env.stopReason}
          </div>
        </div>
      )}

      {env.status === 'canceled' && (
        <div className="banner info">
          <span aria-hidden="true">i</span>
          <div>
            <strong>この送信は取り消されています。</strong>
            {env.stopReason}
          </div>
        </div>
      )}

      {env.status === 'completed' && (
        <div className="banner info">
          <span aria-hidden="true">✔</span>
          <div>
            <strong>締結が完了しています。</strong>
            {env.completedAt && `${formatDateTime(env.completedAt)} に全署名が完了し、`}契約台帳へ登録済みです。
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="stack gap-12">
          <section className="card card-pad" data-tour="esign-signers">
            <div className="section-title">
              <span className="bar" />
              署名の進捗（{prog.signed} / {prog.total} 名）
            </div>
            <div className="progress mb-12">
              <span style={{ width: `${prog.percent}%` }} />
            </div>
            <div>
              {[...env.signers]
                .sort((a, b) => a.order - b.order)
                .map((s, i) => {
                  const sm = signerStatusMeta(s.status);
                  return (
                    <div className="step" key={s.id}>
                      <div
                        className={`step-marker ${
                          s.status === 'signed'
                            ? 'approved'
                            : s.status === 'current'
                              ? 'current'
                              : s.status === 'declined'
                                ? 'rejected'
                                : ''
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="step-main">
                        <div className="step-head">
                          <div className="step-name">
                            {s.side === 'internal' ? '甲（当社）' : '乙（相手先）'}　{s.name}
                          </div>
                          <Badge tone={sm.tone} label={sm.label} />
                        </div>
                        <div className="step-meta">
                          <span>
                            {s.company} {s.title}
                          </span>
                          <span>送信先: {s.email}</span>
                          <span>本人確認: {s.auth}</span>
                          {s.viewedAt && <span>開封: {formatDateTime(s.viewedAt)}</span>}
                          {s.signedAt && <span>署名: {formatDateTime(s.signedAt)}</span>}
                        </div>
                        {s.status === 'current' && s.side === 'counterparty' && (
                          <div className="step-note">
                            相手先はメールのリンクから署名します。デモでは下の「相手先の署名画面を開く」で同じ画面を確認できます。
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="divider" />
            <div data-tour="esign-actions">
              <div className="section-title">
                <span className="bar" />
                この案件への操作
              </div>
              {isInProgress(env) && (
                <div className="row gap-10 wrap">
                  {ourTurn ? (
                    <button className="btn btn-primary btn-lg" onClick={openSignDialog}>
                      自社の署名を実行する
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={() => navigate(`/esign/${env.id}/sign/${next?.id}`)}>
                      相手先の署名画面を開く（デモ）
                    </button>
                  )}
                  <button className="btn btn-secondary btn-lg" onClick={() => actions.remindEnvelope(env.id)}>
                    署名リマインドを送信する
                  </button>
                  {rest < 0 && (
                    <button className="btn btn-secondary btn-lg" onClick={() => setResendOpen(true)}>
                      期限を延長して再送する
                    </button>
                  )}
                  <button className="btn btn-danger-outline btn-lg" onClick={() => setCancelOpen(true)}>
                    送信を取り消す
                  </button>
                </div>
              )}

              {env.status === 'expired' && (
                <div className="row gap-10 wrap">
                  <button className="btn btn-primary btn-lg" onClick={() => setResendOpen(true)}>
                    期限を延長して再送する
                  </button>
                  <button className="btn btn-danger-outline btn-lg" onClick={() => setCancelOpen(true)}>
                    送信を取り消す
                  </button>
                </div>
              )}

              {env.status === 'completed' && (
                <div className="row gap-10 wrap">
                  {env.contractId && (
                    <button className="btn btn-primary btn-lg" onClick={() => navigate(`/contracts/${env.contractId}`)}>
                      登録された契約書を開く
                    </button>
                  )}
                  <button className="btn btn-secondary btn-lg" onClick={() => setCertOpen(true)}>
                    合意締結証明書を表示
                  </button>
                </div>
              )}

              {(env.status === 'declined' || env.status === 'canceled') && (
                <div className="row gap-10 wrap">
                  {env.requestId ? (
                    <button className="btn btn-primary btn-lg" onClick={() => navigate(`/esign/new?requestId=${env.requestId}`)}>
                      内容を見直して再送する
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/esign/new')}>
                      内容を見直して再送する
                    </button>
                  )}
                  <button className="btn btn-secondary btn-lg" onClick={() => navigate('/esign')}>
                    電子契約一覧へ戻る
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約書プレビュー（署名欄の配置）
            </div>
            <ContractDoc
              doc={{
                code: env.code,
                contractType: env.contractType,
                title: env.title,
                counterparty: env.counterparty,
                company,
                property: env.property,
                amount: env.amount,
                rentMonthly: env.rentMonthly,
                startDate: env.startDate,
                endDate: env.endDate,
              }}
              fields={env.fields}
              signers={env.signers}
              completed={env.status === 'completed'}
            />
            <p className="fs-12 text-sub mt-12">
              署名が完了すると、配置した欄に署名者名と署名日が入ります。デモ用の簡易様式です。
            </p>
          </section>
        </div>

        <div className="stack gap-12">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              締結情報
            </div>
            <div className="info-grid one">
              <div className="info-item">
                <div className="k">管理番号</div>
                <div className="v">{env.code}</div>
              </div>
              <div className="info-item">
                <div className="k">署名期限</div>
                <div className="v">
                  {formatDate(env.deadline)}
                  {isInProgress(env) && (rest >= 0 ? `（あと${rest}日）` : `（${-rest}日超過）`)}
                </div>
              </div>
              <div className="info-item">
                <div className="k">リマインド送信</div>
                <div className="v">
                  {env.reminderCount} 回
                  {env.lastReminderAt && `（最終 ${formatDateTime(env.lastReminderAt)}）`}
                </div>
              </div>
              <div className="info-item">
                <div className="k">書類のハッシュ値</div>
                <div className="v hash">{env.documentHash}</div>
              </div>
              <div className="info-item">
                <div className="k">タイムスタンプ</div>
                <div className="v">
                  {env.completedAt ? `${formatDateTime(env.completedAt)}（締結時に付与）` : '締結完了時に付与します'}
                </div>
              </div>
            </div>
            <div className="banner info mt-12" style={{ marginBottom: 0 }}>
              <span aria-hidden="true">i</span>
              <div>署名・締結・証明書の発行はすべて本システム内で行います（外部連携は会計システムのみ）。</div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              監査ログ
            </div>
            <div className="timeline">
              {[...env.audit].reverse().map(a => (
                <div className="tl-item" key={a.id}>
                  <span className="tl-dot" />
                  <div className="tl-time">{formatDateTime(a.at)}</div>
                  <div className="tl-text">
                    <span className="tl-actor">{a.actor}</span>　{a.action}
                  </div>
                  <div className="tl-meta">
                    IPアドレス {a.ip}／{a.device}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <Modal
        isOpen={signOpen}
        onClose={() => setSignOpen(false)}
        title="自社の署名を実行する"
        width={560}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSignOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={doSign}>
              署名を確定する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">
          {next?.name}（{next?.title}）として署名します。署名すると内容は確定し、書類のハッシュ値で改ざんを検知できるようになります。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="sign-name">
            署名欄に表示する氏名<span className="req">必須</span>
          </label>
          <input
            id="sign-name"
            className={`input${signError !== '' && signatureName.trim() === '' ? ' invalid' : ''}`}
            value={signatureName}
            onChange={e => setSignatureName(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="field-label">書体</span>
          <div className="chip-row">
            {SIGNATURE_FONTS.map(f => (
              <button
                key={f.id}
                className={`chip${fontId === f.id ? ' active' : ''}`}
                onClick={() => setFontId(f.id)}
                style={{ fontFamily: f.css }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sign-preview" aria-live="polite">
          <span className="sign-preview-label">署名イメージ</span>
          <span
            className="sign-preview-name"
            style={{ fontFamily: SIGNATURE_FONTS.find(f => f.id === fontId)?.css }}
          >
            {signatureName.trim() === '' ? '（氏名を入力してください）' : signatureName}
          </span>
        </div>
        <label className="check-row mt-12" htmlFor="sign-agree">
          <input id="sign-agree" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
          <span>契約書の内容を確認し、この内容で締結することに同意します</span>
        </label>
        {signError && <span className="field-error">{signError}</span>}
      </Modal>

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="署名依頼の送信を取り消す"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCancelOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-danger-outline" onClick={doCancel}>
              送信を取り消す
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">
          取り消すと相手先は署名できなくなり、監査ログに理由が記録されます。申請は締結待ちの状態に戻ります。
        </p>
        <div className="field">
          <label className="field-label" htmlFor="cancel-reason">
            取消の理由<span className="req">必須</span>
          </label>
          <textarea
            id="cancel-reason"
            className={`textarea${cancelError ? ' invalid' : ''}`}
            value={cancelReason}
            onChange={e => {
              setCancelReason(e.target.value);
              if (cancelError) setCancelError('');
            }}
          />
          {cancelError && <span className="field-error">{cancelError}</span>}
        </div>
      </Modal>

      <Modal
        isOpen={resendOpen}
        onClose={() => setResendOpen(false)}
        title="署名期限を延長して再送する"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResendOpen(false)}>
              キャンセル
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                actions.resendEnvelope(env.id, newDeadline);
                setResendOpen(false);
              }}
            >
              延長して再送する
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">新しい署名期限を指定して、未署名の相手へ署名依頼を再送します。</p>
        <div className="field">
          <label className="field-label" htmlFor="new-deadline">
            新しい署名期限
          </label>
          <input
            id="new-deadline"
            type="date"
            className="input"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
            style={{ maxWidth: '200px' }}
          />
        </div>
      </Modal>

      <Modal isOpen={certOpen} onClose={() => setCertOpen(false)} title="合意締結証明書" width={640}>
        <div className="cert">
          <div className="cert-head">
            <div className="cert-title">合意締結証明書</div>
            <div className="cert-sub">{company}　電子契約システム発行</div>
          </div>
          <dl className="cert-terms">
            <dt>書類名</dt>
            <dd>{env.title}</dd>
            <dt>管理番号</dt>
            <dd>{env.code}</dd>
            <dt>契約相手先</dt>
            <dd>{env.counterparty}</dd>
            <dt>契約金額</dt>
            <dd>{formatYen(env.amount)}</dd>
            <dt>締結日時</dt>
            <dd>{env.completedAt ? formatDateTime(env.completedAt) : '—'}</dd>
            <dt>書類のハッシュ値</dt>
            <dd className="hash">{env.documentHash}</dd>
          </dl>
          <div className="cert-section">署名者</div>
          <SignatureSummary signers={env.signers} />
          <div className="cert-section">アクセス記録</div>
          <div className="table-wrap">
            <table className="data compact">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>操作者</th>
                  <th>操作</th>
                  <th>IPアドレス</th>
                </tr>
              </thead>
              <tbody>
                {env.audit.map(a => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(a.at)}</td>
                    <td>{a.actor}</td>
                    <td>{a.action}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="fs-12 text-sub mt-12">
          デモ用の証明書イメージです。実運用では PDF として出力し、契約書とあわせて保管します。
        </p>
      </Modal>
    </div>
  );
}

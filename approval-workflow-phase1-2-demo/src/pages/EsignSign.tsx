import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Envelope } from '../types';
import type { AppActions } from '../App';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { ContractDoc } from '../components/ContractDoc';
import { SIGNATURE_FONTS } from '../utils/esign';
import type { SignatureFontId } from '../utils/esign';
import { formatDate, formatYen } from '../utils/format';

interface EsignSignProps {
  envelopes: Envelope[];
  company: string;
  actions: AppActions;
}

type Phase = 'mail' | 'auth' | 'document' | 'done' | 'declined';

/**
 * 相手先（署名者）が受け取る署名画面のシミュレーション。
 * 商談で「相手先にはこう見える」を示すためのデモ画面。
 */
export function EsignSign({ envelopes, company, actions }: EsignSignProps) {
  const { id, signerId } = useParams();
  const navigate = useNavigate();
  const env = envelopes.find(e => e.id === id);
  const signer = env?.signers.find(s => s.id === signerId);

  const [phase, setPhase] = useState<Phase>('mail');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [readAll, setReadAll] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState(signer?.name ?? '');
  const [fontId, setFontId] = useState<SignatureFontId>('brush');
  const [signError, setSignError] = useState('');
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState('');

  if (!env || !signer) {
    return (
      <div className="card">
        <EmptyState title="署名画面を表示できません" desc="対象の電子契約または署名者が見つかりませんでした。" />
        <div className="row" style={{ justifyContent: 'center', paddingBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/esign')}>
            電子契約一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  const canSign = signer.status === 'current' && (env.status === 'sent' || env.status === 'signing');

  const openDocument = () => {
    if (signer.auth === 'メール認証＋アクセスコード') setPhase('auth');
    else setPhase('document');
  };

  const checkCode = () => {
    if (code.trim() !== (signer.accessCode ?? '')) {
      setCodeError('アクセスコードが一致しません。送信元からお伝えしたコードをご確認ください');
      return;
    }
    setCodeError('');
    setPhase('document');
  };

  const doSign = () => {
    if (signatureName.trim() === '') {
      setSignError('署名欄に表示するお名前を入力してください');
      return;
    }
    if (!readAll) {
      setSignError('契約書の内容を確認したことにチェックしてください');
      return;
    }
    if (!agreed) {
      setSignError('電子署名により締結することへの同意にチェックしてください');
      return;
    }
    actions.signEnvelope(env.id, signer.id, signatureName.trim());
    setPhase('done');
  };

  const doDecline = () => {
    if (declineReason.trim() === '') {
      setDeclineError('差し戻す理由を入力してください');
      return;
    }
    actions.declineEnvelope(env.id, signer.id, declineReason.trim());
    setDeclineOpen(false);
    setPhase('declined');
  };

  const doc = {
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
  };

  return (
    <div className="signer-view">
      <div className="banner warning">
        <span aria-hidden="true">👀</span>
        <div>
          <strong>相手先の署名画面（デモ）です。</strong>
          {signer.company} の {signer.name} さんがメールから開いた画面を再現しています。
          <button className="btn btn-ghost btn-sm mt-8" onClick={() => navigate(`/esign/${env.id}`)}>
            自社の管理画面に戻る
          </button>
        </div>
      </div>

      {!canSign && phase !== 'done' && phase !== 'declined' && (
        <div className="card card-pad">
          <EmptyState
            title="この書類は現在署名できません"
            desc="すでに署名が完了しているか、送信が取り消された可能性があります。"
          />
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/esign/${env.id}`)}>
              自社の管理画面に戻る
            </button>
          </div>
        </div>
      )}

      {canSign && phase === 'mail' && (
        <section className="card card-pad mail-card">
          <div className="mail-head">
            <div className="mail-line">
              <span className="mail-k">差出人</span>
              <span className="mail-v">{company}　電子契約システム</span>
            </div>
            <div className="mail-line">
              <span className="mail-k">宛先</span>
              <span className="mail-v">{signer.email}</span>
            </div>
            <div className="mail-line">
              <span className="mail-k">件名</span>
              <span className="mail-v">【署名のお願い】{env.title}</span>
            </div>
          </div>
          <div className="mail-body">
            <p>{signer.company}</p>
            <p>{signer.title}　{signer.name} 様</p>
            <p className="mt-12">
              いつもお世話になっております。{company} です。
              下記の契約書について、電子署名によるご締結をお願いいたします。
            </p>
            <ul className="mail-list">
              <li>書類名: {env.title}</li>
              <li>契約金額: {formatYen(env.amount)}</li>
              <li>署名期限: {formatDate(env.deadline)}</li>
            </ul>
            {signer.auth === 'メール認証＋アクセスコード' && (
              <p className="mt-12">
                書類を開く際にアクセスコードの入力が必要です。コードは別途お電話でお伝えした4桁の数字です。
              </p>
            )}
          </div>
          <div className="row gap-10 wrap mt-16">
            <button className="btn btn-primary btn-lg" onClick={openDocument}>
              書類を開いて署名する
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate(`/esign/${env.id}`)}>
              あとで確認する
            </button>
          </div>
        </section>
      )}

      {canSign && phase === 'auth' && (
        <section className="card card-pad" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div className="section-title">
            <span className="bar" />
            アクセスコードの入力
          </div>
          <p className="fs-13 text-sub mb-12">
            本人確認のため、送信元からお伝えしたアクセスコード（数字4桁）を入力してください。
          </p>
          <div className="field">
            <label className="field-label" htmlFor="access-code">
              アクセスコード<span className="req">必須</span>
            </label>
            <input
              id="access-code"
              className={`input${codeError ? ' invalid' : ''}`}
              value={code}
              inputMode="numeric"
              onChange={e => {
                setCode(e.target.value);
                if (codeError) setCodeError('');
              }}
              style={{ maxWidth: '180px', letterSpacing: '0.3em' }}
            />
            {codeError && <span className="field-error">{codeError}</span>}
            <span className="field-note">デモ用のコードは {signer.accessCode} です。</span>
          </div>
          <div className="row gap-10 wrap mt-16">
            <button className="btn btn-primary btn-lg" onClick={checkCode}>
              書類を開く
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setPhase('mail')}>
              前に戻る
            </button>
          </div>
        </section>
      )}

      {canSign && phase === 'document' && (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約書の内容
            </div>
            <ContractDoc doc={doc} fields={env.fields} signers={env.signers} fontId={fontId} />
            <label className="check-row mt-12" htmlFor="read-all">
              <input id="read-all" type="checkbox" checked={readAll} onChange={e => setReadAll(e.target.checked)} />
              <span>契約書の内容をすべて確認しました</span>
            </label>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              電子署名
            </div>
            <div className="info-grid one">
              <div className="info-item">
                <div className="k">署名者</div>
                <div className="v">
                  {signer.name}（{signer.company} {signer.title}）
                </div>
              </div>
              <div className="info-item">
                <div className="k">本人確認</div>
                <div className="v">{signer.auth}</div>
              </div>
              <div className="info-item">
                <div className="k">署名期限</div>
                <div className="v">{formatDate(env.deadline)}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="field">
              <label className="field-label" htmlFor="signer-name">
                署名欄に表示するお名前<span className="req">必須</span>
              </label>
              <input
                id="signer-name"
                className="input"
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
            <div className="sign-preview">
              <span className="sign-preview-label">署名イメージ</span>
              <span
                className="sign-preview-name"
                style={{ fontFamily: SIGNATURE_FONTS.find(f => f.id === fontId)?.css }}
              >
                {signatureName.trim() === '' ? '（お名前を入力してください）' : signatureName}
              </span>
            </div>
            <label className="check-row mt-12" htmlFor="agree-sign">
              <input id="agree-sign" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>電子署名により本契約を締結することに同意します</span>
            </label>
            {signError && <span className="field-error">{signError}</span>}
            <div className="row gap-10 wrap mt-16">
              <button className="btn btn-primary btn-lg" onClick={doSign}>
                署名して締結する
              </button>
              <button className="btn btn-danger-outline btn-lg" onClick={() => setDeclineOpen(true)}>
                署名せずに差し戻す
              </button>
            </div>
          </section>
        </div>
      )}

      {phase === 'done' && (
        <section className="card card-pad result-card">
          <div className="result-mark success" aria-hidden="true">
            ✓
          </div>
          <h2 className="result-title">署名が完了しました</h2>
          <p className="result-desc">
            {env.title} への電子署名を受け付けました。すべての署名者の署名が完了すると、締結済の契約書と合意締結証明書が発行されます。
            控えは登録のメールアドレス（{signer.email}）宛に送付されます。
          </p>
          <div className="row gap-10 wrap" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/esign/${env.id}`)}>
              自社の管理画面で結果を見る
            </button>
          </div>
        </section>
      )}

      {phase === 'declined' && (
        <section className="card card-pad result-card">
          <div className="result-mark error" aria-hidden="true">
            !
          </div>
          <h2 className="result-title">署名せずに差し戻しました</h2>
          <p className="result-desc">
            差戻しの理由は送信元へ通知されました。内容が修正されると、あらためて署名依頼が届きます。
          </p>
          <div className="row gap-10 wrap" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/esign/${env.id}`)}>
              自社の管理画面で結果を見る
            </button>
          </div>
        </section>
      )}

      <Modal
        isOpen={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="署名せずに差し戻す"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeclineOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-danger-outline" onClick={doDecline}>
              差し戻す
            </button>
          </>
        }
      >
        <p className="fs-13 mb-12">差戻しの理由は送信元に通知され、監査ログにも記録されます。</p>
        <div className="field">
          <label className="field-label" htmlFor="decline-reason">
            差戻しの理由<span className="req">必須</span>
          </label>
          <textarea
            id="decline-reason"
            className={`textarea${declineError ? ' invalid' : ''}`}
            value={declineReason}
            onChange={e => {
              setDeclineReason(e.target.value);
              if (declineError) setDeclineError('');
            }}
          />
          {declineError && <span className="field-error">{declineError}</span>}
        </div>
      </Modal>
    </div>
  );
}

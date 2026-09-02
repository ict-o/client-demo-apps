import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Envelope } from '../types';
import type { AppActions } from '../App';
import { EmptyState } from '../components/EmptyState';
import { ContractDoc } from '../components/ContractDoc';
import { SIGNATURE_FONTS } from '../utils/esign';
import type { SignatureFontId } from '../utils/esign';
import { formatYen } from '../utils/format';

interface EsignSignProps {
  envelopes: Envelope[];
  company: string;
  actions: AppActions;
}

type Phase = 'mail' | 'document' | 'done';

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
  const [readAll, setReadAll] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState(signer?.name ?? '');
  const [fontId, setFontId] = useState<SignatureFontId>('brush');
  const [signError, setSignError] = useState('');

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

  const openDocument = () => setPhase('document');

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

      {!canSign && phase !== 'done' && (
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
            </ul>
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

    </div>
  );
}

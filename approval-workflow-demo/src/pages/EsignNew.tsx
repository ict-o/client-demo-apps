import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Member, Request, SignField, Signer } from '../types';
import type { AppActions, EnvelopeDraft } from '../App';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { ContractDoc } from '../components/ContractDoc';
import { addDays, defaultDeadline } from '../utils/esign';
import { formatDate, formatYen, todayIso } from '../utils/format';

interface EsignNewProps {
  requests: Request[];
  members: Member[];
  company: string;
  actions: AppActions;
}

type Step = 1 | 2 | 3;

const STEP_LABELS: { no: Step; label: string }[] = [
  { no: 1, label: '契約内容の確認' },
  { no: 2, label: '署名者・署名期限の設定' },
  { no: 3, label: '署名欄の配置と送信' },
];

let fieldSeq = 0;
const newFieldId = () => `nfd-${(fieldSeq += 1)}`;

export function EsignNew({ requests, members, company, actions }: EsignNewProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestId = params.get('requestId') ?? '';

  // 送信できるのは全承認が完了し、まだ締結していない申請のみ
  const target = requests.find(r => r.id === requestId && r.status === 'approved');
  const candidates = useMemo(
    () => requests.filter(r => r.status === 'approved' && r.counterpartyEsign),
    [requests],
  );

  const sealHolder = members.find(m => m.holdsSeal) ?? members[members.length - 1];

  const [step, setStep] = useState<Step>(1);
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyTitle, setCounterpartyTitle] = useState('契約ご担当者');
  const [counterpartyEmail, setCounterpartyEmail] = useState('');
  const [useAccessCode, setUseAccessCode] = useState(true);
  const [accessCode, setAccessCode] = useState('4821');
  const [internalId, setInternalId] = useState(sealHolder?.id ?? '');
  const [counterpartyFirst, setCounterpartyFirst] = useState(true);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<SignField[]>([]);
  const [placingSignerId, setPlacingSignerId] = useState('');
  const [placingKind, setPlacingKind] = useState<'sign' | 'date'>('sign');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const internalMember = members.find(m => m.id === internalId) ?? sealHolder;

  const signers: Signer[] = useMemo(() => {
    const counterparty: Signer = {
      id: 'new-cp',
      name: counterpartyName.trim() === '' ? '（相手先の署名者）' : counterpartyName.trim(),
      company: target?.counterparty ?? '',
      email: counterpartyEmail.trim(),
      title: counterpartyTitle.trim(),
      side: 'counterparty',
      order: counterpartyFirst ? 1 : 2,
      status: 'waiting',
      auth: useAccessCode ? 'メール認証＋アクセスコード' : 'メール認証',
      accessCode: useAccessCode ? accessCode : undefined,
    };
    const internal: Signer = {
      id: 'new-in',
      name: internalMember?.name ?? '',
      company,
      email: 'daihyo@example.jp',
      title: internalMember?.title ?? '',
      side: 'internal',
      order: counterpartyFirst ? 2 : 1,
      status: 'waiting',
      auth: 'メール認証',
    };
    return [counterparty, internal].sort((a, b) => a.order - b.order);
  }, [
    accessCode,
    company,
    counterpartyEmail,
    counterpartyFirst,
    counterpartyName,
    counterpartyTitle,
    internalMember,
    target,
    useAccessCode,
  ]);

  if (!target) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate('/esign')}>
          ← 電子契約一覧へ戻る
        </button>
        <div className="page-head">
          <div>
            <h1 className="page-title">電子契約の送信準備</h1>
            <p className="page-sub">承認が完了し、相手先が電子契約に対応している申請から作成します。</p>
          </div>
        </div>
        {candidates.length === 0 ? (
          <div className="card">
            <EmptyState
              title="電子契約を作成できる申請はありません"
              desc="承認がすべて完了し、相手先が電子契約に対応している申請が対象です。申請一覧から承認を進めてください。"
            />
            <div className="row" style={{ justifyContent: 'center', paddingBottom: '24px' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/requests')}>
                申請一覧へ移動する
              </button>
            </div>
          </div>
        ) : (
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              対象の申請を選択してください
            </div>
            <div className="stack gap-10">
              {candidates.map(r => (
                <button
                  key={r.id}
                  className="mini-case"
                  onClick={() => navigate(`/esign/new?requestId=${r.id}`)}
                >
                  <span className="row gap-8 wrap">
                    <span className="tag">{r.code}</span>
                    <span className="tag">{r.contractType}</span>
                  </span>
                  <span className="fs-13 fw-600">{r.title}</span>
                  <span className="fs-12 text-sub">
                    {r.counterparty}／{formatYen(r.amount)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const docInfo = {
    contractType: target.contractType,
    title: target.title,
    counterparty: target.counterparty,
    company,
    property: target.property ?? '',
    amount: target.amount,
    rentMonthly: target.rentMonthly ?? 0,
    startDate: target.startDate ?? '',
    endDate: target.endDate ?? '',
  };

  const validateStep2 = () => {
    const next: Record<string, string> = {};
    if (counterpartyName.trim() === '') next.name = '相手先の署名者名を入力してください';
    if (counterpartyEmail.trim() === '') next.email = '署名依頼を送るメールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(counterpartyEmail.trim()))
      next.email = 'メールアドレスの形式が正しくありません（例: tantou@example.jp）';
    if (useAccessCode && !/^\d{4}$/.test(accessCode)) next.code = 'アクセスコードは数字4桁で入力してください';
    if (deadline < todayIso()) next.deadline = '署名期限は今日以降の日付を指定してください';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeField = (x: number, y: number) => {
    const signerId = placingSignerId === '' ? signers[0].id : placingSignerId;
    setFields(prev => [...prev, { id: newFieldId(), signerId, kind: placingKind, x, y }]);
  };

  const autoPlace = () => {
    const first = signers[0];
    const second = signers[1];
    setFields([
      { id: newFieldId(), signerId: first.id, kind: 'sign', x: 12, y: 72 },
      { id: newFieldId(), signerId: first.id, kind: 'date', x: 12, y: 86 },
      { id: newFieldId(), signerId: second.id, kind: 'sign', x: 58, y: 72 },
      { id: newFieldId(), signerId: second.id, kind: 'date', x: 58, y: 86 },
    ]);
  };

  const missingSigner = signers.find(s => !fields.some(f => f.signerId === s.id && f.kind === 'sign'));

  const send = () => {
    const draft: EnvelopeDraft = {
      requestId: target.id,
      requestCode: target.code,
      title: `${target.property ? `${target.property} ` : ''}${target.contractType}`,
      counterparty: target.counterparty,
      contractType: target.contractType,
      property: target.property ?? '',
      amount: target.amount,
      rentMonthly: target.rentMonthly ?? 0,
      startDate: target.startDate ?? todayIso(),
      endDate: target.endDate ?? todayIso(),
      autoRenew: false,
      signers,
      fields,
      deadline,
    };
    const id = actions.sendEnvelope(draft);
    setConfirmOpen(false);
    navigate(`/esign/${id}`);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-12" onClick={() => navigate(`/requests/${target.id}`)}>
        ← 申請詳細へ戻る
      </button>

      <div className="page-head">
        <div>
          <div className="row gap-8 wrap mb-8">
            <span className="tag">{target.code}</span>
            <span className="tag">{target.contractType}</span>
          </div>
          <h1 className="page-title">電子契約の送信準備</h1>
          <p className="page-sub">
            {target.counterparty} と締結します。3つのステップで署名者・署名期限・署名欄を設定して送信します。
          </p>
        </div>
      </div>

      <ol className="wizard-steps">
        {STEP_LABELS.map(s => (
          <li key={s.no} className={`wizard-step${step === s.no ? ' current' : ''}${step > s.no ? ' done' : ''}`}>
            <span className="wizard-no">{step > s.no ? '✓' : s.no}</span>
            <span className="wizard-label">{s.label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="card card-pad">
          <div className="section-title">
            <span className="bar" />
            締結する契約の内容
          </div>
          <p className="fs-13 text-sub mb-12">
            承認済の申請内容がそのまま契約書に反映されます。内容に誤りがある場合は、申請を差し戻して修正してください。
          </p>
          <div className="info-grid">
            <div className="info-item">
              <div className="k">契約相手先</div>
              <div className="v">{target.counterparty}</div>
            </div>
            <div className="info-item">
              <div className="k">契約種別</div>
              <div className="v">{target.contractType}</div>
            </div>
            <div className="info-item">
              <div className="k">物件情報</div>
              <div className="v">{target.property && target.property !== '' ? target.property : '—'}</div>
            </div>
            <div className="info-item">
              <div className="k">契約金額</div>
              <div className="v">{formatYen(target.amount)}</div>
            </div>
            <div className="info-item">
              <div className="k">月額賃料</div>
              <div className="v">{target.rentMonthly && target.rentMonthly > 0 ? formatYen(target.rentMonthly) : '—'}</div>
            </div>
            <div className="info-item">
              <div className="k">契約期間</div>
              <div className="v">
                {target.startDate ? formatDate(target.startDate) : '—'} 〜{' '}
                {target.endDate ? formatDate(target.endDate) : '—'}
              </div>
            </div>
          </div>
          <div className="divider" />
          <div className="banner info" style={{ marginBottom: 0 }}>
            <span aria-hidden="true">i</span>
            <div>
              電子契約の送信・署名・締結はすべて本システム内で行います。外部の電子契約サービスへ契約書を預けることはありません。
            </div>
          </div>
          <div className="row gap-10 wrap mt-16">
            <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
              次へ（署名者の設定）
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/requests/${target.id}`)}>
              キャンセル
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              署名者
            </div>

            <div className="signer-block">
              <div className="signer-block-head">
                <span className="tag">乙</span>
                相手先（{target.counterparty}）
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cp-name">
                  署名者名<span className="req">必須</span>
                </label>
                <input
                  id="cp-name"
                  className={`input${errors.name ? ' invalid' : ''}`}
                  value={counterpartyName}
                  onChange={e => setCounterpartyName(e.target.value)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cp-title">
                  役職・部署
                </label>
                <input
                  id="cp-title"
                  className="input"
                  value={counterpartyTitle}
                  onChange={e => setCounterpartyTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cp-email">
                  署名依頼の送信先メールアドレス<span className="req">必須</span>
                </label>
                <input
                  id="cp-email"
                  className={`input${errors.email ? ' invalid' : ''}`}
                  value={counterpartyEmail}
                  onChange={e => setCounterpartyEmail(e.target.value)}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
                <span className="field-note">デモのため実際にメールは送信されません。</span>
              </div>
              <div className="field">
                <label className="check-row" htmlFor="cp-code-use">
                  <input
                    id="cp-code-use"
                    type="checkbox"
                    checked={useAccessCode}
                    onChange={e => setUseAccessCode(e.target.checked)}
                  />
                  <span>アクセスコードによる本人確認を併用する（メールの転送による代理署名を防ぎます）</span>
                </label>
              </div>
              {useAccessCode && (
                <div className="field">
                  <label className="field-label" htmlFor="cp-code">
                    アクセスコード（数字4桁）
                  </label>
                  <input
                    id="cp-code"
                    className={`input${errors.code ? ' invalid' : ''}`}
                    value={accessCode}
                    inputMode="numeric"
                    onChange={e => setAccessCode(e.target.value)}
                    style={{ maxWidth: '160px' }}
                  />
                  {errors.code && <span className="field-error">{errors.code}</span>}
                  <span className="field-note">コードは電話・チャットなど、メールとは別の手段で伝えます。</span>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="signer-block">
              <div className="signer-block-head">
                <span className="tag">甲</span>
                当社（{company}）
              </div>
              <div className="field">
                <label className="field-label" htmlFor="in-signer">
                  当社の締結者
                </label>
                <select
                  id="in-signer"
                  className="select"
                  value={internalId}
                  onChange={e => setInternalId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.department} {m.title}　{m.name}
                    </option>
                  ))}
                </select>
                <span className="field-note">
                  紙の契約では実印を保有する代表取締役のみが締結できます。電子契約でも同じ権限で運用できます。
                </span>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              署名順と署名期限
            </div>
            <div className="field">
              <span className="field-label">署名順</span>
              <label className="check-row" htmlFor="order-cp">
                <input
                  id="order-cp"
                  type="radio"
                  name="signorder"
                  checked={counterpartyFirst}
                  onChange={() => setCounterpartyFirst(true)}
                />
                <span>相手先が先に署名し、その後に当社が署名する（推奨）</span>
              </label>
              <label className="check-row" htmlFor="order-in">
                <input
                  id="order-in"
                  type="radio"
                  name="signorder"
                  checked={!counterpartyFirst}
                  onChange={() => setCounterpartyFirst(false)}
                />
                <span>当社が先に署名し、その後に相手先が署名する</span>
              </label>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="deadline">
                署名期限
              </label>
              <input
                id="deadline"
                type="date"
                className={`input${errors.deadline ? ' invalid' : ''}`}
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={{ maxWidth: '200px' }}
              />
              {errors.deadline && <span className="field-error">{errors.deadline}</span>}
              <div className="row gap-8 wrap mt-8">
                {[3, 7, 14].map(d => (
                  <button key={d} className="btn btn-ghost btn-sm" onClick={() => setDeadline(addDays(todayIso(), d))}>
                    {d}日後にする
                  </button>
                ))}
              </div>
              <span className="field-note">
                期限の3日前と前日に、署名が済んでいない相手へ自動でリマインドを送ります。
              </span>
            </div>

            <div className="divider" />
            <div className="section-title">
              <span className="bar" />
              送信順の確認
            </div>
            <div className="route-preview">
              {signers.map((s, i) => (
                <div key={s.id}>
                  {i > 0 && <div className="route-arrow" aria-hidden="true">↓</div>}
                  <div className="route-node">
                    <span className="route-no">{i + 1}</span>
                    <div>
                      <div className="route-name">{s.name}</div>
                      <div className="route-approver">
                        {s.company}　{s.title}
                      </div>
                      <div className="route-reason">本人確認: {s.auth}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row gap-10 wrap mt-16">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
              >
                次へ（署名欄の配置）
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
                前に戻る
              </button>
            </div>
          </section>
        </div>
      )}

      {step === 3 && (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              署名欄の配置
            </div>
            <p className="fs-13 text-sub mb-12">
              配置する署名者と欄の種類を選び、右の書類上をクリックすると欄が置かれます。置いた欄は「×」で取り消せます。
            </p>
            <div className="field">
              <span className="field-label">配置する署名者</span>
              <div className="chip-row">
                {signers.map(s => (
                  <button
                    key={s.id}
                    className={`chip${(placingSignerId === '' ? signers[0].id : placingSignerId) === s.id ? ' active' : ''}`}
                    onClick={() => setPlacingSignerId(s.id)}
                  >
                    {s.side === 'internal' ? '甲' : '乙'}　{s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">欄の種類</span>
              <div className="chip-row">
                <button
                  className={`chip${placingKind === 'sign' ? ' active' : ''}`}
                  onClick={() => setPlacingKind('sign')}
                >
                  署名欄
                </button>
                <button
                  className={`chip${placingKind === 'date' ? ' active' : ''}`}
                  onClick={() => setPlacingKind('date')}
                >
                  署名日欄
                </button>
              </div>
            </div>
            <div className="row gap-10 wrap">
              <button className="btn btn-secondary btn-sm" onClick={autoPlace}>
                標準の位置に自動配置する
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setFields([])} disabled={fields.length === 0}>
                配置をすべて取り消す
              </button>
            </div>

            <div className="divider" />
            <div className="stack gap-8">
              {signers.map(s => {
                const placed = fields.filter(f => f.signerId === s.id);
                return (
                  <div className="row gap-8 wrap" key={s.id}>
                    <span className="fs-13 fw-600">{s.name}</span>
                    <span className={`fs-12 ${placed.some(f => f.kind === 'sign') ? 'text-sub' : 'text-error'}`}>
                      {placed.some(f => f.kind === 'sign')
                        ? `署名欄 ${placed.filter(f => f.kind === 'sign').length} 箇所・署名日欄 ${
                            placed.filter(f => f.kind === 'date').length
                          } 箇所を配置済`
                        : '署名欄が未配置です'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="row gap-10 wrap mt-16">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setConfirmOpen(true)}
                disabled={missingSigner !== undefined}
                title={missingSigner ? `${missingSigner.name} さんの署名欄を配置してください` : undefined}
              >
                内容を確認して送信する
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)}>
                前に戻る
              </button>
            </div>
            {missingSigner && (
              <p className="fs-12 text-error mt-8">
                {missingSigner.name} さんの署名欄が配置されていないため送信できません。
              </p>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約書プレビュー
            </div>
            <ContractDoc
              doc={docInfo}
              fields={fields}
              signers={signers}
              onPlace={placeField}
              onRemoveField={id => setFields(prev => prev.filter(f => f.id !== id))}
              placingSignerId={placingSignerId === '' ? signers[0].id : placingSignerId}
            />
            <p className="fs-12 text-sub mt-12">
              デモ用の簡易様式です。実際の契約書様式は導入時に定義し、同じ操作で署名欄を配置できます。
            </p>
          </section>
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="この内容で署名依頼を送信します"
        width={560}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={send}>
              署名依頼を送信する
            </button>
          </>
        }
      >
        <div className="info-grid">
          <div className="info-item">
            <div className="k">契約内容</div>
            <div className="v">
              {target.contractType}（{target.counterparty}）
            </div>
          </div>
          <div className="info-item">
            <div className="k">契約金額</div>
            <div className="v">{formatYen(target.amount)}</div>
          </div>
          <div className="info-item">
            <div className="k">最初の署名者</div>
            <div className="v">
              {signers[0].name}（{signers[0].company}）
            </div>
          </div>
          <div className="info-item">
            <div className="k">署名期限</div>
            <div className="v">{formatDate(deadline)}</div>
          </div>
          <div className="info-item">
            <div className="k">本人確認</div>
            <div className="v">{signers.map(s => `${s.name}: ${s.auth}`).join(' ／ ')}</div>
          </div>
          <div className="info-item">
            <div className="k">配置した欄</div>
            <div className="v">{fields.length} 箇所</div>
          </div>
        </div>
        <div className="banner info mt-16" style={{ marginBottom: 0 }}>
          <span aria-hidden="true">i</span>
          <div>送信後、署名の状況は電子契約の詳細画面で確認できます。全員の署名が完了すると契約台帳へ自動登録されます。</div>
        </div>
      </Modal>
    </div>
  );
}

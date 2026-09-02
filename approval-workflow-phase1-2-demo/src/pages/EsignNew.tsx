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
  { no: 2, label: '署名者・署名順・署名期限の設定' },
  { no: 3, label: '署名欄の配置と送信' },
];

/** 送信準備画面で編集する署名者1名分の入力値 */
interface SignerInput {
  key: string;
  side: 'internal' | 'counterparty';
  name: string;
  title: string;
  email: string;
  /** 相手先署名者の会社名（自社署名者は運営会社を使う） */
  company: string;
  /** 自社署名者として選んだ利用者のID */
  memberId?: string;
  useAccessCode: boolean;
  accessCode: string;
}

let fieldSeq = 0;
const newFieldId = () => `nfd-${(fieldSeq += 1)}`;
let signerSeq = 0;
const newSignerKey = () => `sgn-${(signerSeq += 1)}`;

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000));

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
  const [signerInputs, setSignerInputs] = useState<SignerInput[]>([
    {
      key: newSignerKey(),
      side: 'counterparty',
      name: '',
      title: '契約ご担当者',
      email: '',
      company: target?.counterparty ?? '',
      useAccessCode: true,
      accessCode: randomCode(),
    },
    {
      key: newSignerKey(),
      side: 'internal',
      name: sealHolder?.name ?? '',
      title: sealHolder?.title ?? '',
      email: sealHolder?.email ?? '',
      company,
      memberId: sealHolder?.id,
      useAccessCode: false,
      accessCode: '',
    },
  ]);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<SignField[]>([]);
  const [placingSignerKey, setPlacingSignerKey] = useState('');
  const [placingKind, setPlacingKind] = useState<'sign' | 'date'>('sign');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const signers: Signer[] = useMemo(
    () =>
      signerInputs.map((si, i) => ({
        id: si.key,
        name: si.name.trim() === '' ? (si.side === 'internal' ? '（当社の署名者）' : '（相手先の署名者）') : si.name.trim(),
        company: si.side === 'internal' ? company : si.company.trim() === '' ? (target?.counterparty ?? '') : si.company.trim(),
        email: si.email.trim(),
        title: si.title.trim(),
        side: si.side,
        order: i + 1,
        status: 'waiting' as const,
        auth: si.useAccessCode ? ('メール認証＋アクセスコード' as const) : ('メール認証' as const),
        accessCode: si.useAccessCode ? si.accessCode : undefined,
      })),
    [company, signerInputs, target],
  );

  const update = (key: string, patch: Partial<SignerInput>) => {
    setSignerInputs(prev => prev.map(si => (si.key === key ? { ...si, ...patch } : si)));
    setErrors({});
  };

  const addSigner = (side: 'internal' | 'counterparty') => {
    setSignerInputs(prev => [
      ...prev,
      side === 'counterparty'
        ? {
            key: newSignerKey(),
            side,
            name: '',
            title: '契約ご担当者',
            email: '',
            company: target?.counterparty ?? '',
            useAccessCode: true,
            accessCode: randomCode(),
          }
        : {
            key: newSignerKey(),
            side,
            name: sealHolder?.name ?? '',
            title: sealHolder?.title ?? '',
            email: sealHolder?.email ?? '',
            company,
            memberId: sealHolder?.id,
            useAccessCode: false,
            accessCode: '',
          },
    ]);
  };

  const removeSigner = (key: string) => {
    setSignerInputs(prev => (prev.length <= 2 ? prev : prev.filter(si => si.key !== key)));
    setFields(prev => prev.filter(f => f.signerId !== key));
  };

  const move = (key: string, dir: -1 | 1) => {
    setSignerInputs(prev => {
      const i = prev.findIndex(si => si.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

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
              送信できる申請
            </div>
            <div className="stack gap-10">
              {candidates.map(r => (
                <button
                  key={r.id}
                  className="mini-case"
                  style={{ textAlign: 'left' }}
                  onClick={() => navigate(`/esign/new?requestId=${r.id}`)}
                >
                  <div className="fw-600">{r.title}</div>
                  <div className="fs-12 text-sub">
                    {r.code}／{r.counterparty}／{formatYen(r.amount)}
                  </div>
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
    signerInputs.forEach((si, i) => {
      const no = i + 1;
      if (si.name.trim() === '') next[`name-${si.key}`] = `${no}人目の署名者名を入力してください`;
      if (si.email.trim() === '') next[`email-${si.key}`] = `${no}人目の署名依頼を送るメールアドレスを入力してください`;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(si.email.trim()))
        next[`email-${si.key}`] = 'メールアドレスの形式が正しくありません（例: tantou@example.jp）';
      if (si.side === 'counterparty' && si.company.trim() === '')
        next[`company-${si.key}`] = '相手先の企業名を入力してください';
      if (si.useAccessCode && !/^\d{4}$/.test(si.accessCode))
        next[`code-${si.key}`] = 'アクセスコードは数字4桁で入力してください';
    });
    if (deadline < todayIso()) next.deadline = '署名期限は今日以降の日付を指定してください';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeField = (x: number, y: number) => {
    const signerId = placingSignerKey === '' ? signers[0].id : placingSignerKey;
    setFields(prev => [...prev, { id: newFieldId(), signerId, kind: placingKind, x, y }]);
  };

  const autoPlace = () => {
    const width = 100 / signers.length;
    setFields(
      signers.flatMap((s, i) => {
        const x = Math.min(8 + i * width, 78);
        return [
          { id: newFieldId(), signerId: s.id, kind: 'sign' as const, x, y: 72 },
          { id: newFieldId(), signerId: s.id, kind: 'date' as const, x, y: 86 },
        ];
      }),
    );
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
            {target.counterparty} と締結します。3つのステップで署名者・署名順・署名期限・署名欄を設定して送信します。署名者は3名以上でも設定できます。
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
          <div className="stack gap-12">
            <section className="card card-pad" data-tour="signer-list">
              <div className="section-title">
                <span className="bar" />
                署名者と署名順（{signerInputs.length}名）
              </div>
              <p className="fs-13 text-sub mb-12">
                上から順に署名依頼が回ります。「上へ」「下へ」で署名順を入れ替えられます。署名者は必要なだけ追加できます。
              </p>

              <div className="stack gap-12">
                {signerInputs.map((si, i) => (
                  <div className="signer-block" key={si.key}>
                    <div className="signer-block-head">
                      <span className="tag">{i + 1}人目</span>
                      <span className="tag">{si.side === 'internal' ? '甲（当社）' : '乙（相手先）'}</span>
                      <span className="grow" />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => move(si.key, -1)}
                        disabled={i === 0}
                        title={i === 0 ? 'これ以上、上へ移動できません' : undefined}
                      >
                        上へ
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => move(si.key, 1)}
                        disabled={i === signerInputs.length - 1}
                        title={i === signerInputs.length - 1 ? 'これ以上、下へ移動できません' : undefined}
                      >
                        下へ
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeSigner(si.key)}
                        disabled={signerInputs.length <= 2}
                        title={signerInputs.length <= 2 ? '署名者は2名以上必要です' : undefined}
                      >
                        削除
                      </button>
                    </div>

                    {si.side === 'internal' ? (
                      <div className="field">
                        <label className="field-label" htmlFor={`in-${si.key}`}>
                          当社の署名者
                        </label>
                        <select
                          id={`in-${si.key}`}
                          className="select"
                          value={si.memberId ?? ''}
                          onChange={e => {
                            const m = members.find(x => x.id === e.target.value);
                            update(si.key, {
                              memberId: e.target.value,
                              name: m?.name ?? '',
                              title: m?.title ?? '',
                              email: m?.email ?? '',
                            });
                          }}
                        >
                          {members
                            .filter(m => m.active)
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                {m.department} {m.title}　{m.name}
                              </option>
                            ))}
                        </select>
                        <span className="field-note">
                          紙の契約では実印を保有する代表取締役のみが締結できます。電子契約でも同じ権限で運用できます。
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="field">
                          <label className="field-label" htmlFor={`cp-company-${si.key}`}>
                            相手先の企業名<span className="req">必須</span>
                          </label>
                          <input
                            id={`cp-company-${si.key}`}
                            className={`input${errors[`company-${si.key}`] ? ' invalid' : ''}`}
                            value={si.company}
                            onChange={e => update(si.key, { company: e.target.value })}
                          />
                          {errors[`company-${si.key}`] && (
                            <span className="field-error">{errors[`company-${si.key}`]}</span>
                          )}
                          <span className="field-note">相手先が複数社にわたる契約でも、社ごとに署名者を追加できます。</span>
                        </div>
                        <div className="field">
                          <label className="field-label" htmlFor={`cp-name-${si.key}`}>
                            署名者名<span className="req">必須</span>
                          </label>
                          <input
                            id={`cp-name-${si.key}`}
                            className={`input${errors[`name-${si.key}`] ? ' invalid' : ''}`}
                            value={si.name}
                            onChange={e => update(si.key, { name: e.target.value })}
                          />
                          {errors[`name-${si.key}`] && <span className="field-error">{errors[`name-${si.key}`]}</span>}
                        </div>
                        <div className="field">
                          <label className="field-label" htmlFor={`cp-title-${si.key}`}>
                            役職
                          </label>
                          <input
                            id={`cp-title-${si.key}`}
                            className="input"
                            value={si.title}
                            onChange={e => update(si.key, { title: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="field">
                      <label className="field-label" htmlFor={`email-${si.key}`}>
                        署名依頼の送信先メールアドレス<span className="req">必須</span>
                      </label>
                      <input
                        id={`email-${si.key}`}
                        className={`input${errors[`email-${si.key}`] ? ' invalid' : ''}`}
                        value={si.email}
                        onChange={e => update(si.key, { email: e.target.value })}
                      />
                      {errors[`email-${si.key}`] && <span className="field-error">{errors[`email-${si.key}`]}</span>}
                      <span className="field-note">デモのため実際にメールは送信されません。</span>
                    </div>

                    <div className="field">
                      <label className="check-row" htmlFor={`code-use-${si.key}`}>
                        <input
                          id={`code-use-${si.key}`}
                          type="checkbox"
                          checked={si.useAccessCode}
                          onChange={e =>
                            update(si.key, {
                              useAccessCode: e.target.checked,
                              accessCode: e.target.checked && si.accessCode === '' ? randomCode() : si.accessCode,
                            })
                          }
                        />
                        <span>アクセスコードによる本人確認を併用する（メールの転送による代理署名を防ぎます）</span>
                      </label>
                    </div>
                    {si.useAccessCode && (
                      <div className="field">
                        <label className="field-label" htmlFor={`code-${si.key}`}>
                          アクセスコード（数字4桁）
                        </label>
                        <input
                          id={`code-${si.key}`}
                          className={`input${errors[`code-${si.key}`] ? ' invalid' : ''}`}
                          value={si.accessCode}
                          inputMode="numeric"
                          onChange={e => update(si.key, { accessCode: e.target.value })}
                          style={{ maxWidth: '160px' }}
                        />
                        {errors[`code-${si.key}`] && <span className="field-error">{errors[`code-${si.key}`]}</span>}
                        <span className="field-note">コードは電話・チャットなど、メールとは別の手段で伝えます。</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="row gap-10 wrap mt-16">
                <button className="btn btn-secondary btn-sm" onClick={() => addSigner('counterparty')}>
                  相手先の署名者を追加
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => addSigner('internal')}>
                  当社の署名者を追加
                </button>
              </div>
            </section>

            <section className="card card-pad">
              <div className="section-title">
                <span className="bar" />
                署名期限
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
                  onChange={e => {
                    setDeadline(e.target.value);
                    setErrors({});
                  }}
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
                  期限の3日前と前日に、署名が済んでいない相手へ自動でリマインドを送ります。期限を過ぎた案件は、期限を延長して再送できます。
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

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約書プレビュー
            </div>
            <ContractDoc doc={docInfo} fields={fields} signers={signers} />
            <p className="fs-12 text-sub mt-12">
              次のステップで、この書類上に署名欄を配置します。
            </p>
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
                {signers.map((s, i) => (
                  <button
                    key={s.id}
                    className={`chip${(placingSignerKey === '' ? signers[0].id : placingSignerKey) === s.id ? ' active' : ''}`}
                    onClick={() => setPlacingSignerKey(s.id)}
                  >
                    {i + 1}　{s.name}
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
              placingSignerId={placingSignerKey === '' ? signers[0].id : placingSignerKey}
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
            <div className="k">署名者（署名順）</div>
            <div className="v">{signers.map((s, i) => `${i + 1}. ${s.name}（${s.company}）`).join(' ／ ')}</div>
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
          <div>送信後、署名の状況は電子契約の詳細画面で確認できます。全員の署名が完了すると契約書管理へ自動登録されます。</div>
        </div>
      </Modal>
    </div>
  );
}

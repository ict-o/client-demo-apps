import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContractType, InboxFile, Member } from '../types';
import type { AppActions, ContractDraft } from '../App';
import { EmptyState } from '../components/EmptyState';
import { canWriteByRole, folderOptions } from '../utils/domain';
import { formatDateTime, formatYen } from '../utils/format';

interface ContractRegisterProps {
  inbox: InboxFile[];
  viewer: Member;
  actions: AppActions;
}

const CONTRACT_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約', '工事請負契約', '業務委託契約'];

interface DraftForm extends Omit<ContractDraft, 'rentMonthly' | 'amount'> {
  rentMonthly: string;
  amount: string;
}

const emptyDraft = (file: InboxFile): DraftForm => ({
  title: file.guess.title,
  counterparty: file.guess.counterparty,
  contractType: file.guess.contractType,
  property: '',
  rentMonthly: '',
  amount: '',
  startDate: '',
  endDate: '',
  autoRenew: false,
  folder: `${file.guess.contractType}／締結済`,
});

/** 紙契約書のPDF登録（受領したPDFを選び、契約情報を入力して契約台帳へ登録する） */
export function ContractRegister({ inbox, viewer, actions }: ContractRegisterProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = inbox.find(f => f.id === selectedId) ?? null;
  const canWrite = canWriteByRole(viewer.role);

  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setDraft(prev => (prev ? { ...prev, [key]: value } : prev));
    setErrors(prev => (prev[key as string] ? { ...prev, [key as string]: '' } : prev));
  };

  const startInput = (file: InboxFile) => {
    setSelectedId(file.id);
    setDraft(emptyDraft(file));
    setErrors({});
  };

  const backToSelect = () => {
    setSelectedId(null);
    setDraft(null);
    setErrors({});
  };

  const register = () => {
    if (!draft || !selected) return;
    const amountNum = Number(draft.amount.replace(/[^0-9]/g, '')) || 0;
    const rentNum = Number(draft.rentMonthly.replace(/[^0-9]/g, '')) || 0;
    const e: Record<string, string> = {};
    if (draft.title.trim() === '') e.title = '契約件名を入力してください';
    if (draft.counterparty.trim() === '') e.counterparty = '契約相手先企業名を入力してください';
    if (draft.amount.trim() === '') e.amount = '契約金額を入力してください';
    if (draft.startDate === '') e.startDate = '契約開始日を入力してください';
    if (draft.endDate === '') e.endDate = '契約満了日を入力してください';
    if (draft.startDate !== '' && draft.endDate !== '' && draft.endDate < draft.startDate) {
      e.endDate = '契約満了日は開始日より後の日付を入力してください';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const id = actions.registerContract(
      selected.id,
      {
        title: draft.title.trim(),
        counterparty: draft.counterparty.trim(),
        contractType: draft.contractType,
        property: draft.property.trim(),
        rentMonthly: rentNum,
        amount: amountNum,
        startDate: draft.startDate,
        endDate: draft.endDate,
        autoRenew: draft.autoRenew,
        folder: draft.folder,
      },
      'scan',
    );
    backToSelect();
    navigate(`/contracts/${id}`);
  };

  if (!canWrite) {
    return (
      <div className="card">
        <EmptyState
          title="契約書を登録する権限がありません"
          desc="紙契約書の登録は、申請者・承認者・システム管理者の権限で行えます。画面右上の利用者切替で権限のある利用者に切り替えてください。"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">紙契約書の登録</h1>
          <p className="page-sub">
            複合機スキャン・メール添付・郵送で届いた紙の契約書PDFを選び、契約情報を入力して契約台帳へ登録します。電子契約で締結した契約書は締結時に自動登録されるため、この画面での登録は不要です。
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/contracts')}>
          契約書管理へ戻る
        </button>
      </div>

      {!draft || !selected ? (
        <div className="two-col">
          <section className="card card-pad" data-tour="inbox-list">
            <div className="section-title">
              <span className="bar" />
              登録待ちのファイル（{inbox.length}件）
            </div>
            {inbox.length === 0 ? (
              <EmptyState
                title="登録待ちのファイルはありません"
                desc="複合機でスキャンした契約書やメール添付の契約書が届くとここに表示されます。"
              />
            ) : (
              <div className="stack gap-10">
                {inbox.map(f => (
                  <button
                    key={f.id}
                    className={`file-card${selectedId === f.id ? ' selected' : ''}`}
                    onClick={() => startInput(f)}
                  >
                    <span className="file-icn" aria-hidden="true">
                      PDF
                    </span>
                    <span style={{ display: 'block', minWidth: 0 }}>
                      <span className="file-name" style={{ display: 'block' }}>
                        {f.fileName}
                      </span>
                      <span className="file-meta" style={{ display: 'block' }}>
                        {f.source}／{f.pages}ページ／受信 {formatDateTime(f.receivedAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              登録の手順
            </div>
            <ol className="guide-steps">
              <li>
                <span className="guide-no">1</span>
                <span className="guide-text">左の一覧から登録するPDFを選びます。</span>
              </li>
              <li>
                <span className="guide-no">2</span>
                <span className="guide-text">
                  契約件名・相手先・契約金額・契約期間などの主要項目を入力します。ファイル名から推定できる項目はあらかじめ入力されています。
                </span>
              </li>
              <li>
                <span className="guide-no">3</span>
                <span className="guide-text">保管フォルダを選んで登録すると、契約台帳から検索できるようになります。</span>
              </li>
            </ol>
            <div className="divider" />
            <p className="fs-12 text-muted">
              契約書の内容をAIが自動で読み取り、保管先を自動で振り分ける機能は、このフェーズの対象外です。
            </p>
          </section>
        </div>
      ) : (
        <div className="two-col">
          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              契約情報の入力（{selected.fileName}）
            </div>
            <p className="fs-13 text-sub mb-12">
              ファイル名から契約件名・相手先・契約種別を仮入力しています。原本を確認して修正・追記してください。
            </p>

            <div className="field">
              <label className="field-label" htmlFor="d-title">
                契約件名<span className="req">必須</span>
              </label>
              <input
                id="d-title"
                className={`input${errors.title ? ' invalid' : ''}`}
                value={draft.title}
                onChange={e => set('title', e.target.value)}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-cp">
                契約相手先企業名<span className="req">必須</span>
              </label>
              <input
                id="d-cp"
                className={`input${errors.counterparty ? ' invalid' : ''}`}
                value={draft.counterparty}
                onChange={e => set('counterparty', e.target.value)}
              />
              {errors.counterparty && <span className="field-error">{errors.counterparty}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-type">
                契約種別
              </label>
              <select
                id="d-type"
                className="select"
                value={draft.contractType}
                onChange={e => {
                  const next = e.target.value as ContractType;
                  setDraft(prev => (prev ? { ...prev, contractType: next, folder: `${next}／締結済` } : prev));
                }}
              >
                {CONTRACT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="d-prop">
                物件情報
              </label>
              <input id="d-prop" className="input" value={draft.property} onChange={e => set('property', e.target.value)} />
              <span className="field-note">物件に紐づかない契約は空欄のままで登録できます。</span>
            </div>

            <div className="info-grid">
              <div className="field">
                <label className="field-label" htmlFor="d-rent">
                  月額賃料（円）
                </label>
                <input
                  id="d-rent"
                  className="input"
                  inputMode="numeric"
                  value={draft.rentMonthly}
                  onChange={e => set('rentMonthly', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-amount">
                  契約金額（円）<span className="req">必須</span>
                </label>
                <input
                  id="d-amount"
                  className={`input${errors.amount ? ' invalid' : ''}`}
                  inputMode="numeric"
                  value={draft.amount}
                  onChange={e => set('amount', e.target.value)}
                />
                {errors.amount && <span className="field-error">{errors.amount}</span>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-start">
                  契約開始日<span className="req">必須</span>
                </label>
                <input
                  id="d-start"
                  type="date"
                  className={`input${errors.startDate ? ' invalid' : ''}`}
                  value={draft.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
                {errors.startDate && <span className="field-error">{errors.startDate}</span>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-end">
                  契約満了日<span className="req">必須</span>
                </label>
                <input
                  id="d-end"
                  type="date"
                  className={`input${errors.endDate ? ' invalid' : ''}`}
                  value={draft.endDate}
                  onChange={e => set('endDate', e.target.value)}
                />
                {errors.endDate && <span className="field-error">{errors.endDate}</span>}
              </div>
            </div>

            <div className="info-grid">
              <div className="field">
                <label className="field-label" htmlFor="d-renew">
                  自動更新
                </label>
                <select
                  id="d-renew"
                  className="select"
                  value={draft.autoRenew ? 'yes' : 'no'}
                  onChange={e => set('autoRenew', e.target.value === 'yes')}
                >
                  <option value="yes">あり</option>
                  <option value="no">なし</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="d-folder">
                  保管フォルダ
                </label>
                <select id="d-folder" className="select" value={draft.folder} onChange={e => set('folder', e.target.value)}>
                  {folderOptions(draft.contractType).map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row gap-10 wrap mt-16">
              <button className="btn btn-primary btn-lg" onClick={register}>
                この内容で契約書を登録する
              </button>
              <button className="btn btn-secondary btn-lg" onClick={backToSelect}>
                ファイルの選択に戻る
              </button>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              登録内容の確認
            </div>
            <p className="fs-13 text-sub mb-12">入力した内容は、そのまま契約台帳の項目として登録されます。</p>
            <div className="info-item">
              <div className="k">原本ファイル</div>
              <div className="v">{selected.fileName}</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">原本の保管形態</div>
              <div className="v">スキャン原本（{selected.source}／{selected.pages}ページ）</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">保管フォルダ</div>
              <div className="v">{draft.folder}</div>
            </div>
            <div className="divider" />
            <div className="info-item">
              <div className="k">契約金額</div>
              <div className="v">{formatYen(Number(draft.amount.replace(/[^0-9]/g, '')) || 0)}</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">月額賃料</div>
              <div className="v">{formatYen(Number(draft.rentMonthly.replace(/[^0-9]/g, '')) || 0)}</div>
            </div>
            <div className="info-item mt-12">
              <div className="k">契約期間</div>
              <div className="v">
                {draft.startDate === '' || draft.endDate === ''
                  ? '未入力'
                  : `${draft.startDate.replace(/-/g, '/')} 〜 ${draft.endDate.replace(/-/g, '/')}`}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

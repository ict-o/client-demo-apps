import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ContractType, Member, RequestKind } from '../types';
import type { AppActions, NewRequestInput } from '../App';
import { RoutePreview } from '../components/RoutePreview';
import { formatYen, todayIso } from '../utils/format';

interface RequestNewProps {
  members: Member[];
  actions: AppActions;
}

const CONTRACT_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約', '工事請負契約', '業務委託契約'];

interface FormState {
  kind: RequestKind;
  title: string;
  purpose: string;
  amount: string;
  contractType: ContractType;
  counterparty: string;
  counterpartyEsign: 'yes' | 'no';
  property: string;
  rentMonthly: string;
  startDate: string;
  endDate: string;
}

const EMPTY: FormState = {
  kind: 'ringi',
  title: '',
  purpose: '',
  amount: '',
  contractType: '賃貸借契約',
  counterparty: '',
  counterpartyEsign: 'yes',
  property: '',
  rentMonthly: '',
  startDate: todayIso(),
  endDate: '',
};

export function RequestNew({ members, actions }: RequestNewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state ?? null) as Partial<FormState> | null;

  const [form, setForm] = useState<FormState>({ ...EMPTY, ...(prefill ?? {}) });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const amountNum = Number(form.amount.replace(/[^0-9]/g, '')) || 0;
  const rentNum = Number(form.rentMonthly.replace(/[^0-9]/g, '')) || 0;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.title.trim() === '') e.title = '件名を入力してください';
    if (form.purpose.trim() === '') e.purpose = '申請理由・目的を入力してください';
    if (form.counterparty.trim() === '') e.counterparty = '契約相手先を入力してください';
    if (amountNum <= 0) e.amount = '契約金額を1円以上で入力してください';
    if (form.startDate === '') e.startDate = '開始日を入力してください';
    if (form.endDate === '') e.endDate = '終了日を入力してください';
    if (form.startDate !== '' && form.endDate !== '' && form.endDate < form.startDate) {
      e.endDate = '終了日は開始日より後の日付を入力してください';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const input: NewRequestInput = {
      kind: form.kind,
      title: form.title.trim(),
      purpose: form.purpose.trim(),
      amount: amountNum,
      contractType: form.contractType,
      counterparty: form.counterparty.trim(),
      counterpartyEsign: form.counterpartyEsign === 'yes',
      property: form.property.trim(),
      rentMonthly: rentNum,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    const id = actions.addRequest(input);
    navigate(`/requests/${id}`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">新規申請の作成</h1>
          <p className="page-sub">
            入力内容に応じて承認ルートが自動で組み立てられます。右側のプレビューは入力に合わせて即時に更新されます。
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/requests')}>
          申請一覧へ戻る
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="two-col">
          <div className="card card-pad">
            <div className="section-title">
              <span className="bar" />
              申請内容
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-kind">
                申請種別<span className="req">必須</span>
              </label>
              <select id="f-kind" className="select" value={form.kind} onChange={e => set('kind', e.target.value as RequestKind)}>
                <option value="ringi">稟議書（購買・契約の承認）</option>
                <option value="seal">捺印申請（実印・銀行印の押印）</option>
              </select>
              {form.kind === 'seal' && (
                <span className="fs-12 text-sub mt-4" style={{ display: 'block' }}>
                  実印・銀行印は代表取締役のみが保有しているため、代表取締役承認が自動で追加されます。
                </span>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-title">
                件名<span className="req">必須</span>
              </label>
              <input
                id="f-title"
                className={`input${errors.title ? ' invalid' : ''}`}
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-purpose">
                申請理由・目的<span className="req">必須</span>
              </label>
              <textarea
                id="f-purpose"
                className={`textarea${errors.purpose ? ' invalid' : ''}`}
                value={form.purpose}
                onChange={e => set('purpose', e.target.value)}
              />
              {errors.purpose && <span className="field-error">{errors.purpose}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-ctype">
                契約種別<span className="req">必須</span>
              </label>
              <select
                id="f-ctype"
                className="select"
                value={form.contractType}
                onChange={e => set('contractType', e.target.value as ContractType)}
              >
                {CONTRACT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-cp">
                契約相手先（企業名）<span className="req">必須</span>
              </label>
              <input
                id="f-cp"
                className={`input${errors.counterparty ? ' invalid' : ''}`}
                value={form.counterparty}
                onChange={e => set('counterparty', e.target.value)}
              />
              {errors.counterparty && <span className="field-error">{errors.counterparty}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-esign">
                相手先の電子契約対応<span className="req">必須</span>
              </label>
              <select
                id="f-esign"
                className="select"
                value={form.counterpartyEsign}
                onChange={e => set('counterpartyEsign', e.target.value as 'yes' | 'no')}
              >
                <option value="yes">対応している（電子契約で締結可能）</option>
                <option value="no">対応していない（紙の契約書で締結）</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-property">
                物件情報
              </label>
              <input id="f-property" className="input" value={form.property} onChange={e => set('property', e.target.value)} />
              <span className="fs-12 text-sub mt-4" style={{ display: 'block' }}>
                建物名・部屋番号・面積など。契約書管理の検索対象になります。
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-amount">
                契約金額（円）<span className="req">必須</span>
              </label>
              <input
                id="f-amount"
                className={`input${errors.amount ? ' invalid' : ''}`}
                inputMode="numeric"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
              <span className="fs-12 text-sub mt-4" style={{ display: 'block' }}>
                入力額: {formatYen(amountNum)}
              </span>
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="f-rent">
                月額賃料（円）
              </label>
              <input
                id="f-rent"
                className="input"
                inputMode="numeric"
                value={form.rentMonthly}
                onChange={e => set('rentMonthly', e.target.value)}
              />
              <span className="fs-12 text-sub mt-4" style={{ display: 'block' }}>
                賃料が発生しない契約は空欄のままで構いません。入力額: {formatYen(rentNum)}
              </span>
            </div>

            <div className="info-grid">
              <div className="field">
                <label className="field-label" htmlFor="f-start">
                  契約開始日<span className="req">必須</span>
                </label>
                <input
                  id="f-start"
                  type="date"
                  className={`input${errors.startDate ? ' invalid' : ''}`}
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
                {errors.startDate && <span className="field-error">{errors.startDate}</span>}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="f-end">
                  契約終了日<span className="req">必須</span>
                </label>
                <input
                  id="f-end"
                  type="date"
                  className={`input${errors.endDate ? ' invalid' : ''}`}
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                />
                {errors.endDate && <span className="field-error">{errors.endDate}</span>}
              </div>
            </div>

            <div className="row gap-10 wrap mt-16">
              <button type="submit" className="btn btn-primary btn-lg">
                この内容で申請する
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/requests')}>
                取りやめる
              </button>
            </div>
          </div>

          <div className="stack gap-12">
            <div className="card card-pad">
              <div className="section-title">
                <span className="bar" />
                承認ルート（自動判定）
              </div>
              <RoutePreview
                input={{ kind: form.kind, amount: amountNum, contractType: form.contractType }}
                members={members}
              />
              <p className="fs-12 text-sub mt-12">
                金額・契約種別・申請種別を変更すると、承認段階が自動で組み替わります。判定条件は「承認ルート設定」で確認できます。
              </p>
            </div>

            <div className={`banner ${form.counterpartyEsign === 'yes' ? 'info' : 'warning'}`} style={{ marginBottom: 0 }}>
              <span aria-hidden="true">{form.counterpartyEsign === 'yes' ? '✔' : '!'}</span>
              <div>
                {form.counterpartyEsign === 'yes' ? (
                  <>
                    <strong>電子契約で締結できます。</strong>
                    承認完了後、そのまま電子契約の送信に進めます。
                  </>
                ) : (
                  <>
                    <strong>紙の契約書での締結になります。</strong>
                    承認完了後は代表取締役への捺印手配へ進み、捺印済の原本をスキャン取込して契約書管理に登録します。
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
